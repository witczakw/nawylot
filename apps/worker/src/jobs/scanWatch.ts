import {
  BAGGAGE_ESTIMATE_PER_PERSON_MINOR,
  DEFAULT_SCAN_INTERVAL_MINUTES,
  HISTORY_WINDOW_DAYS,
  cheapest,
  cheapestDistinct,
  expandWatch,
  isScanDue,
  money,
  routeKey,
  scanBudget,
  scanIndex,
  scoreDeal,
  stayWindow,
  toIsoDate,
  totalCost,
} from '@nawylot/core'
import { offers, priceHistory, watches, type Db } from '@nawylot/db'
import type { FlightOffer, FlightProvider, StayProvider } from '@nawylot/providers'
import { and, eq, gte } from 'drizzle-orm'
import type PgBoss from 'pg-boss'
import type { Logger } from '../logger'

export const SCAN_WATCH_QUEUE = 'scan-watch'
export const SCHEDULE_SCANS_QUEUE = 'schedule-scans'
export const SCHEDULE_SCANS_CRON = '*/15 * * * *'

const DAY_MS = 24 * 60 * 60 * 1000

export interface ScanDeps {
  db: Db
  flights: FlightProvider
  stays: StayProvider
  log: Logger
  now: () => Date
}

export interface ScanResult {
  flightQueries: number
  flightsFound: number
  offersSaved: number
}

export async function scanWatch(deps: ScanDeps, watchId: string): Promise<ScanResult> {
  const { db, flights, stays, log } = deps
  const now = deps.now()
  const result: ScanResult = { flightQueries: 0, flightsFound: 0, offersSaved: 0 }

  const [watch] = await db.select().from(watches).where(eq(watches.id, watchId))
  if (!watch?.active) {
    log.info('scan-watch skipped: watch missing or inactive', { watchId })
    return result
  }

  const budget = scanBudget(DEFAULT_SCAN_INTERVAL_MINUTES)
  const { queries } = expandWatch(watch, {
    today: toIsoDate(now),
    limit: budget.flightQueries,
    scanIndex: scanIndex(now, DEFAULT_SCAN_INTERVAL_MINUTES),
  })

  const found: FlightOffer[] = []
  for (const query of queries) {
    const flightOffers = await flights.searchFlights({
      origin: query.origin,
      destination: query.destination,
      outboundDate: query.outboundDate,
      returnDate: query.returnDate,
      adults: watch.pax,
      currency: watch.currency,
    })
    found.push(...flightOffers)
  }
  result.flightQueries = queries.length
  result.flightsFound = found.length

  const candidates = cheapestDistinct(
    found.flatMap((flight) => {
      const window = stayWindow(
        flight.outbound.arrivesAt,
        flight.returnDate,
        flight.inbound?.departsAt ?? null,
      )
      return window ? [{ flight, window }] : []
    }),
    budget.stayQueries,
    ({ flight }) => flight.pricePerPerson,
    ({ flight, window }) => `${flight.destination}|${window.checkIn}|${window.checkOut}`,
  )

  const historySince = new Date(now.getTime() - HISTORY_WINDOW_DAYS * DAY_MS)
  const newOffers: (typeof offers.$inferInsert)[] = []

  for (const { flight, window } of candidates) {
    const stay = cheapest(
      await stays.searchStays({
        destination: flight.destination,
        checkIn: window.checkIn,
        checkOut: window.checkOut,
        adults: watch.pax,
        currency: watch.currency,
      }),
      (offer) => offer.pricePerNight,
    )
    if (!stay) {
      log.info('scan-watch: no stay for flight', {
        watchId,
        destination: flight.destination,
        ...window,
      })
      continue
    }

    const cost = totalCost({
      flightPerPerson: flight.pricePerPerson,
      pax: watch.pax,
      stayPerNight: stay.pricePerNight,
      nights: window.nights,
      baggagePerPerson: money(BAGGAGE_ESTIMATE_PER_PERSON_MINOR, watch.currency),
    })

    const history = await db
      .select({ priceMinor: priceHistory.priceMinor, currency: priceHistory.currency })
      .from(priceHistory)
      .where(
        and(
          eq(priceHistory.routeKey, routeKey(flight.origin, flight.destination)),
          eq(priceHistory.currency, flight.pricePerPerson.currency),
          gte(priceHistory.fetchedAt, historySince),
        ),
      )
    const score = scoreDeal(
      flight.pricePerPerson,
      history.map((row) => money(row.priceMinor, row.currency)),
    )

    newOffers.push({
      watchId: watch.id,
      flightJson: flight,
      stayJson: stay,
      totalMinor: cost.total.amountMinor,
      currency: cost.total.currency,
      score,
      // Starsza z dwóch dat — alert nie może sugerować, że cała kwota jest świeższa niż jest.
      fetchedAt: flight.fetchedAt < stay.fetchedAt ? flight.fetchedAt : stay.fetchedAt,
      deepLinks: { flight: flight.deepLink, stay: stay.deepLink },
    })
  }

  await db.transaction(async (tx) => {
    if (newOffers.length > 0) await tx.insert(offers).values(newOffers)
    await tx.update(watches).set({ lastScannedAt: now }).where(eq(watches.id, watch.id))
  })
  result.offersSaved = newOffers.length

  log.info('scan-watch done', { watchId, ...result })
  return result
}

export async function dueWatchIds(db: Db, now: Date): Promise<string[]> {
  const active = await db
    .select({ id: watches.id, lastScannedAt: watches.lastScannedAt })
    .from(watches)
    .where(eq(watches.active, true))
  return active
    .filter((watch) => isScanDue(watch.lastScannedAt, now, DEFAULT_SCAN_INTERVAL_MINUTES))
    .map((watch) => watch.id)
}

function watchIdFrom(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'watchId' in data) {
    const { watchId } = data
    if (typeof watchId === 'string') return watchId
  }
  throw new Error(`Job ${SCAN_WATCH_QUEUE} bez watchId: ${JSON.stringify(data)}`)
}

export async function registerScanWatch(boss: PgBoss, deps: ScanDeps): Promise<void> {
  // stately: najwyżej jeden oczekujący i jeden trwający skan danego watcha (singletonKey).
  await boss.createQueue(SCAN_WATCH_QUEUE, {
    name: SCAN_WATCH_QUEUE,
    policy: 'stately',
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
  })
  await boss.work(SCAN_WATCH_QUEUE, async (jobs) => {
    for (const job of jobs) await scanWatch(deps, watchIdFrom(job.data))
  })

  await boss.createQueue(SCHEDULE_SCANS_QUEUE)
  await boss.schedule(SCHEDULE_SCANS_QUEUE, SCHEDULE_SCANS_CRON)
  await boss.work(SCHEDULE_SCANS_QUEUE, async () => {
    const ids = await dueWatchIds(deps.db, deps.now())
    for (const watchId of ids) {
      await boss.send(SCAN_WATCH_QUEUE, { watchId }, { singletonKey: watchId })
    }
    deps.log.info('schedule-scans done', { due: ids.length })
  })
}
