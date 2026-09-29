import { money } from '@nawylot/core'
import { offers, priceHistory, users, watches, type Db } from '@nawylot/db'
import { connectTestDb, testDatabaseUrl } from '@nawylot/db/testing'
import type {
  FlightOffer,
  FlightProvider,
  FlightSearch,
  StayOffer,
  StayProvider,
  StaySearch,
} from '@nawylot/providers'
import { eq, inArray } from 'drizzle-orm'
import PgBoss from 'pg-boss'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createLogger } from '../logger'
import {
  SCAN_WATCH_QUEUE,
  dueWatchIds,
  registerScanWatch,
  scanWatch,
  type ScanDeps,
} from './scanWatch'

const NOW = new Date('2026-09-29T19:40:00Z')
const FLIGHTS_FETCHED_AT = new Date('2026-09-29T19:38:00Z')
const STAYS_FETCHED_AT = new Date('2026-09-29T19:39:00Z')
const pln = (zl: number) => money(zl * 100, 'PLN')

function flight(
  destination: string,
  priceZl: number,
  arrivesAt: string,
  overrides: Partial<FlightOffer> = {},
): FlightOffer {
  return {
    provider: 'test-flights',
    origin: 'POZ',
    destination,
    outboundDate: '2026-10-16',
    returnDate: '2026-10-18',
    outbound: {
      from: 'POZ',
      to: destination,
      departsAt: '2026-10-16T06:05',
      arrivesAt,
      stops: 0,
      carriers: ['Test Air'],
    },
    inbound: null,
    pricePerPerson: pln(priceZl),
    deepLink: `https://flights.example.com/${destination}/${priceZl}`,
    fetchedAt: FLIGHTS_FETCHED_AT,
    ...overrides,
  }
}

function stay(name: string, priceZl: number): StayOffer {
  return {
    provider: 'test-stays',
    name,
    checkIn: '2026-10-16',
    checkOut: '2026-10-18',
    pricePerNight: pln(priceZl),
    deepLink: `https://stays.example.com/${encodeURIComponent(name)}`,
    fetchedAt: STAYS_FETCHED_AT,
  }
}

function fakeProviders(flightOffers: FlightOffer[], stayOffers: StayOffer[]) {
  const flightSearches: FlightSearch[] = []
  const staySearches: StaySearch[] = []
  const flights: FlightProvider = {
    id: 'test-flights',
    searchFlights: async (search) => {
      flightSearches.push(search)
      return flightOffers.filter(
        (f) => search.destination === null || f.destination === search.destination,
      )
    },
  }
  const stays: StayProvider = {
    id: 'test-stays',
    searchStays: async (search) => {
      staySearches.push(search)
      return stayOffers
    },
  }
  return { flights, stays, flightSearches, staySearches }
}

describe.skipIf(!testDatabaseUrl)('scan-watch (Postgres)', () => {
  let db: Db
  let userId: string
  const routeKeys = ['POZ-BCN', 'POZ-OPO', 'POZ-NAP', 'POZ-TIA']
  const log = createLogger(() => undefined)

  async function insertWatch(values: Partial<typeof watches.$inferInsert> = {}) {
    const [watch] = await db
      .insert(watches)
      .values({
        userId,
        origins: ['POZ'],
        destinations: ['BCN'],
        dateFrom: '2026-10-16',
        dateTo: '2026-10-18',
        nightsMin: 2,
        nightsMax: 2,
        pax: 2,
        budgetMinor: 150_000,
        currency: 'PLN',
        ...values,
      })
      .returning()
    if (!watch) throw new Error('insert watches nie zwrócił wiersza')
    return watch
  }

  function deps(providers: Pick<ScanDeps, 'flights' | 'stays'>): ScanDeps {
    return { db, log, now: () => NOW, ...providers }
  }

  beforeAll(async () => {
    db = await connectTestDb()
    const [user] = await db.insert(users).values({}).returning({ id: users.id })
    if (!user) throw new Error('insert users nie zwrócił wiersza')
    userId = user.id
  })

  afterAll(async () => {
    await db.delete(users).where(eq(users.id, userId))
    await db.delete(priceHistory).where(inArray(priceHistory.routeKey, routeKeys))
    await db.$client.end()
  })

  it('zapisuje top-N ofert: najtańszy lot na każde okno noclegu, koszt dla 2 osób, osobne linki', async () => {
    const watch = await insertWatch()
    const providers = fakeProviders(
      [
        flight('BCN', 412, '2026-10-16T09:00'),
        flight('BCN', 389, '2026-10-16T12:10'),
        // Nocny lot: wylot 23:50, przylot 01:40 następnego dnia → nocleg od 17.10.
        flight('BCN', 455, '2026-10-17T01:40', {
          outbound: {
            from: 'POZ',
            to: 'BCN',
            departsAt: '2026-10-16T23:50',
            arrivesAt: '2026-10-17T01:40',
            stops: 0,
            carriers: ['Test Air'],
          },
        }),
      ],
      [stay('Hotel Drogi', 520), stay('Hostel Rambla', 387)],
    )

    const result = await scanWatch(deps(providers), watch.id)

    expect(result).toEqual({ flightQueries: 1, flightsFound: 3, offersSaved: 2 })
    expect(providers.flightSearches).toEqual([
      {
        origin: 'POZ',
        destination: 'BCN',
        outboundDate: '2026-10-16',
        returnDate: '2026-10-18',
        adults: 2,
        currency: 'PLN',
      },
    ])
    expect(providers.staySearches.map((s) => `${s.checkIn}/${s.checkOut}/${s.adults}`)).toEqual([
      '2026-10-16/2026-10-18/2',
      '2026-10-17/2026-10-18/2',
    ])

    const saved = await db
      .select()
      .from(offers)
      .where(eq(offers.watchId, watch.id))
      .orderBy(offers.totalMinor)
    // Nocny lot: 455 × 2 + 387 × 1 noc = 1297 zł; poranny: 389 × 2 + 387 × 2 noce = 1552 zł.
    expect(saved.map((o) => [o.totalMinor, o.currency, o.score])).toEqual([
      [129_700, 'PLN', 0],
      [155_200, 'PLN', 0],
    ])
    expect(saved[1]?.deepLinks).toEqual({
      flight: 'https://flights.example.com/BCN/389',
      stay: 'https://stays.example.com/Hostel%20Rambla',
    })
    expect(saved[1]?.fetchedAt).toEqual(FLIGHTS_FETCHED_AT)

    const [scanned] = await db.select().from(watches).where(eq(watches.id, watch.id))
    expect(scanned?.lastScannedAt).toEqual(NOW)
  })

  it('liczy score względem mediany cen trasy z ostatnich 90 dni w tej samej walucie', async () => {
    const watch = await insertWatch({ destinations: ['OPO'] })
    const recent = new Date('2026-09-20T10:00:00Z')
    await db.insert(priceHistory).values([
      ...[450, 480, 500, 530, 900].map((zl) => ({
        routeKey: 'POZ-OPO',
        date: '2026-10-16',
        priceMinor: zl * 100,
        currency: 'PLN',
        fetchedAt: recent,
      })),
      // Poza oknem 90 dni i w innej walucie — nie liczą się do mediany.
      ...[100, 100, 100].map((zl) => ({
        routeKey: 'POZ-OPO',
        date: '2026-05-01',
        priceMinor: zl * 100,
        currency: 'PLN',
        fetchedAt: new Date('2026-06-01T10:00:00Z'),
      })),
      ...[10, 10, 10].map((eur) => ({
        routeKey: 'POZ-OPO',
        date: '2026-10-16',
        priceMinor: eur * 100,
        currency: 'EUR',
        fetchedAt: recent,
      })),
    ])
    const providers = fakeProviders(
      [flight('OPO', 400, '2026-10-16T11:00')],
      [stay('Casa Ribeira', 300)],
    )

    await scanWatch(deps(providers), watch.id)

    const [saved] = await db.select().from(offers).where(eq(offers.watchId, watch.id))
    expect(saved?.score).toBe(20)
  })

  it('pomija lot, dla którego nie ma noclegu, ale zapisuje, że watch był skanowany', async () => {
    const watch = await insertWatch({ destinations: ['NAP'] })
    const providers = fakeProviders([flight('NAP', 350, '2026-10-16T10:00')], [])

    const result = await scanWatch(deps(providers), watch.id)

    expect(result.offersSaved).toBe(0)
    const [scanned] = await db.select().from(watches).where(eq(watches.id, watch.id))
    expect(scanned?.lastScannedAt).toEqual(NOW)
  })

  it('nie skanuje wyłączonego watcha', async () => {
    const watch = await insertWatch({ active: false })
    const providers = fakeProviders([flight('BCN', 389, '2026-10-16T12:10')], [])

    await scanWatch(deps(providers), watch.id)

    expect(providers.flightSearches).toEqual([])
    const [scanned] = await db.select().from(watches).where(eq(watches.id, watch.id))
    expect(scanned?.lastScannedAt).toBeNull()
  })

  it('błąd providera przerywa skan bez zapisu (pg-boss ponowi job), last_scanned_at bez zmian', async () => {
    const watch = await insertWatch()
    const failing: FlightProvider = {
      id: 'failing',
      searchFlights: async () => {
        throw new Error('HTTP 429 Too Many Requests')
      },
    }
    const { stays } = fakeProviders([], [])

    await expect(scanWatch(deps({ flights: failing, stays }), watch.id)).rejects.toThrow('HTTP 429')

    expect(await db.select().from(offers).where(eq(offers.watchId, watch.id))).toEqual([])
    const [scanned] = await db.select().from(watches).where(eq(watches.id, watch.id))
    expect(scanned?.lastScannedAt).toBeNull()
  })

  it('dueWatchIds: nieskanowany watch jest do skanu, świeżo skanowany i wyłączony — nie', async () => {
    const fresh = await insertWatch()
    const scannedRecently = await insertWatch({ lastScannedAt: new Date('2026-09-29T18:40:00Z') })
    const scannedYesterday = await insertWatch({ lastScannedAt: new Date('2026-09-28T19:00:00Z') })
    const inactive = await insertWatch({ active: false })

    const due = await dueWatchIds(db, NOW)

    expect(due).toContain(fresh.id)
    expect(due).toContain(scannedYesterday.id)
    expect(due).not.toContain(scannedRecently.id)
    expect(due).not.toContain(inactive.id)
  })

  it('job scan-watch w pg-boss wykonuje skan watcha z danych joba', async () => {
    const watch = await insertWatch({ destinations: ['TIA'] })
    const providers = fakeProviders(
      [flight('TIA', 299, '2026-10-16T10:00')],
      [stay('Tirana Inn', 150)],
    )
    const boss = new PgBoss({ connectionString: testDatabaseUrl, schema: 'pgboss_test_scan' })
    boss.on('error', (err) => log.error('pg-boss error', { err }))
    await boss.start()
    try {
      await registerScanWatch(boss, deps(providers))
      await boss.send(SCAN_WATCH_QUEUE, { watchId: watch.id }, { singletonKey: watch.id })

      await vi.waitFor(
        async () => {
          const saved = await db.select().from(offers).where(eq(offers.watchId, watch.id))
          expect(saved).toHaveLength(1)
        },
        { timeout: 10_000, interval: 200 },
      )
    } finally {
      await boss.stop({ graceful: false })
    }
  })
})
