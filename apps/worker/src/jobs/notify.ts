import {
  buildAlertMessage,
  daysBetween,
  decideDelivery,
  money,
  offerFingerprint,
  totalCost,
  BAGGAGE_ESTIMATE_PER_PERSON_MINOR,
} from '@nawylot/core'
import { alertsSent, notificationPrefs, offers, users, watches, type Db } from '@nawylot/db'
import type { ChannelId, NotificationChannel } from '@nawylot/notifications'
import { and, count, desc, eq, gte } from 'drizzle-orm'
import type PgBoss from 'pg-boss'
import { z } from 'zod'
import type { Logger } from '../logger'

export const NOTIFY_QUEUE = 'notify'

const DAY_MS = 24 * 60 * 60 * 1000

const storedMoney = z.object({ amountMinor: z.number().int(), currency: z.string().length(3) })
// scan-watch zapisuje w offers pełne FlightOffer / StayOffer; tu czytamy tylko potrzebne pola.
const storedFlight = z.object({
  origin: z.string(),
  destination: z.string(),
  outboundDate: z.string(),
  returnDate: z.string(),
  pricePerPerson: storedMoney,
})
const storedStay = z.object({
  checkIn: z.string(),
  checkOut: z.string(),
  pricePerNight: storedMoney,
})

const channelIds = ['expo', 'telegram', 'email', 'webpush'] as const satisfies readonly ChannelId[]
const notifyJobData = z.object({
  offerId: z.uuid(),
  watchId: z.uuid(),
  // Ustawione, gdy job wraca po quiet hours tylko dla jednego kanału.
  channel: z.enum(channelIds).optional(),
})
export type NotifyJobData = z.infer<typeof notifyJobData>

export interface NotifyDeps {
  db: Db
  channels: readonly NotificationChannel[]
  log: Logger
  now: () => Date
}

export type NotifyOutcome =
  | { channel: ChannelId; status: 'sent' | 'not-linked' }
  | { channel: ChannelId; status: 'skipped'; reason: 'duplicate' | 'daily-limit' }
  | { channel: ChannelId; status: 'deferred'; minutes: number }

export async function notifyOffer(
  deps: NotifyDeps,
  offerId: string,
  onlyChannel?: ChannelId,
): Promise<NotifyOutcome[]> {
  const { db, log } = deps
  const now = deps.now()

  const [row] = await db
    .select({ offer: offers, watch: watches, timeZone: users.timezone })
    .from(offers)
    .innerJoin(watches, eq(offers.watchId, watches.id))
    .innerJoin(users, eq(watches.userId, users.id))
    .where(eq(offers.id, offerId))
  if (!row) {
    log.warn('notify: offer not found', { offerId })
    return []
  }
  const { offer, watch, timeZone } = row
  const flight = storedFlight.parse(offer.flightJson)
  const stay = storedStay.parse(offer.stayJson)
  const nights = daysBetween(stay.checkIn, stay.checkOut)
  const cost = totalCost({
    flightPerPerson: money(flight.pricePerPerson.amountMinor, flight.pricePerPerson.currency),
    pax: watch.pax,
    stayPerNight: money(stay.pricePerNight.amountMinor, stay.pricePerNight.currency),
    nights,
    baggagePerPerson: money(BAGGAGE_ESTIMATE_PER_PERSON_MINOR, offer.currency),
  })
  const message = buildAlertMessage({
    offerId: offer.id,
    origin: flight.origin,
    destination: flight.destination,
    outboundDate: flight.outboundDate,
    returnDate: flight.returnDate,
    pax: watch.pax,
    nights,
    cost,
    budgetPerPerson: money(watch.budgetMinor, watch.currency),
    fetchedAt: offer.fetchedAt,
    timeZone,
    links: offer.deepLinks,
  })
  const fingerprint = offerFingerprint(flight)

  const prefs = await db
    .select()
    .from(notificationPrefs)
    .where(and(eq(notificationPrefs.userId, watch.userId), eq(notificationPrefs.enabled, true)))

  const outcomes: NotifyOutcome[] = []
  for (const pref of prefs) {
    if (onlyChannel !== undefined && pref.channel !== onlyChannel) continue
    const channel = deps.channels.find((c) => c.id === pref.channel)
    if (!channel) {
      log.warn('notify: channel enabled but not configured in worker', { channel: pref.channel })
      continue
    }

    const [sentToday] = await db
      .select({ n: count() })
      .from(alertsSent)
      .innerJoin(watches, eq(alertsSent.watchId, watches.id))
      .where(
        and(
          eq(watches.userId, watch.userId),
          eq(alertsSent.channel, pref.channel),
          gte(alertsSent.sentAt, new Date(now.getTime() - DAY_MS)),
        ),
      )
    const [previous] = await db
      .select({ totalMinor: alertsSent.totalMinor, currency: alertsSent.currency })
      .from(alertsSent)
      .where(
        and(
          eq(alertsSent.watchId, watch.id),
          eq(alertsSent.channel, pref.channel),
          eq(alertsSent.offerFingerprint, fingerprint),
        ),
      )
      .orderBy(desc(alertsSent.sentAt))
      .limit(1)

    const decision = decideDelivery({
      now,
      timeZone,
      quietHoursFrom: pref.quietHoursFrom,
      quietHoursTo: pref.quietHoursTo,
      alertsSentLast24h: sentToday?.n ?? 0,
      previouslyAlerted: previous ? money(previous.totalMinor, previous.currency) : null,
      total: cost.total,
    })
    if (decision.action === 'skip') {
      outcomes.push({ channel: pref.channel, status: 'skipped', reason: decision.reason })
      continue
    }
    if (decision.action === 'defer') {
      outcomes.push({ channel: pref.channel, status: 'deferred', minutes: decision.minutes })
      continue
    }

    const result = await channel.send({ id: watch.userId }, message)
    if (result.status === 'sent') {
      await db.insert(alertsSent).values({
        watchId: watch.id,
        channel: pref.channel,
        offerFingerprint: fingerprint,
        totalMinor: cost.total.amountMinor,
        currency: cost.total.currency,
        sentAt: now,
        providerReceiptId: result.receiptId,
      })
    }
    outcomes.push({ channel: pref.channel, status: result.status })
  }

  log.info('notify done', { offerId, outcomes })
  return outcomes
}

export async function createNotifyQueue(boss: PgBoss): Promise<void> {
  // singleton per watch (singletonKey): powiadomienia jednego watcha idą po kolei,
  // więc dwie oferty tego samego wyjazdu nie ominą deduplikacji przez alerts_sent.
  await boss.createQueue(NOTIFY_QUEUE, {
    name: NOTIFY_QUEUE,
    policy: 'singleton',
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
  })
}

export async function enqueueNotify(
  boss: PgBoss,
  data: NotifyJobData,
  startAfterSeconds?: number,
): Promise<string | null> {
  return boss.send(NOTIFY_QUEUE, data, {
    singletonKey: data.watchId,
    ...(startAfterSeconds === undefined ? {} : { startAfter: startAfterSeconds }),
  })
}

export async function registerNotify(boss: PgBoss, deps: NotifyDeps): Promise<void> {
  await createNotifyQueue(boss)
  await boss.work(NOTIFY_QUEUE, async (jobs) => {
    for (const job of jobs) {
      const data = notifyJobData.parse(job.data)
      const outcomes = await notifyOffer(deps, data.offerId, data.channel)
      for (const outcome of outcomes) {
        if (outcome.status === 'deferred') {
          await enqueueNotify(boss, { ...data, channel: outcome.channel }, outcome.minutes * 60)
        }
      }
    }
  })
}
