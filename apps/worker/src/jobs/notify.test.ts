import type { AlertMessage } from '@nawylot/core'
import { alertsSent, notificationPrefs, offers, users, watches, type Db } from '@nawylot/db'
import { connectTestDb, testDatabaseUrl } from '@nawylot/db/testing'
import type { NotificationChannel, SendResult, UserRef } from '@nawylot/notifications'
import { eq } from 'drizzle-orm'
import PgBoss from 'pg-boss'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createLogger } from '../logger'
import { NOTIFY_QUEUE, enqueueNotify, notifyOffer, registerNotify, type NotifyDeps } from './notify'

// 17:00 UTC = 19:00 w Warszawie, poza quiet hours 22:00–07:00.
const DAYTIME = new Date('2026-09-29T17:00:00Z')
const FETCHED_AT = new Date('2026-09-29T16:40:00Z')

function recordingChannel(result: SendResult = { status: 'sent', receiptId: 'tg-101' }) {
  const sent: { user: UserRef; msg: AlertMessage }[] = []
  const channel: NotificationChannel = {
    id: 'telegram',
    send: async (user, msg) => {
      sent.push({ user, msg })
      return result
    },
  }
  return { channel, sent }
}

describe.skipIf(!testDatabaseUrl)('notify (Postgres)', () => {
  let db: Db
  const userIds: string[] = []
  const log = createLogger(() => undefined)

  async function setup(prefs: Partial<typeof notificationPrefs.$inferInsert> = {}) {
    const [user] = await db
      .insert(users)
      .values({ timezone: 'Europe/Warsaw' })
      .returning({ id: users.id })
    if (!user) throw new Error('insert users nie zwrócił wiersza')
    userIds.push(user.id)
    await db.insert(notificationPrefs).values({
      userId: user.id,
      channel: 'telegram',
      quietHoursFrom: '22:00',
      quietHoursTo: '07:00',
      ...prefs,
    })
    const [watch] = await db
      .insert(watches)
      .values({
        userId: user.id,
        origins: ['POZ'],
        destinations: ['BCN'],
        dateFrom: '2026-10-16',
        dateTo: '2026-10-18',
        nightsMin: 2,
        nightsMax: 2,
        pax: 1,
        budgetMinor: 150_000,
        currency: 'PLN',
      })
      .returning({ id: watches.id })
    if (!watch) throw new Error('insert watches nie zwrócił wiersza')
    return { userId: user.id, watchId: watch.id }
  }

  async function insertOffer(watchId: string, flightZl = 412, stayPerNightZl = 387) {
    const [offer] = await db
      .insert(offers)
      .values({
        watchId,
        flightJson: {
          provider: 'test-flights',
          origin: 'POZ',
          destination: 'BCN',
          outboundDate: '2026-10-16',
          returnDate: '2026-10-18',
          pricePerPerson: { amountMinor: flightZl * 100, currency: 'PLN' },
          deepLink: 'https://flights.example.com/1',
          fetchedAt: FETCHED_AT.toISOString(),
        },
        stayJson: {
          provider: 'test-stays',
          name: 'Hostel Rambla',
          checkIn: '2026-10-16',
          checkOut: '2026-10-18',
          pricePerNight: { amountMinor: stayPerNightZl * 100, currency: 'PLN' },
          deepLink: 'https://stays.example.com/1',
          fetchedAt: FETCHED_AT.toISOString(),
        },
        totalMinor: (flightZl + 2 * stayPerNightZl) * 100,
        currency: 'PLN',
        score: 0,
        fetchedAt: FETCHED_AT,
        deepLinks: { flight: 'https://flights.example.com/1', stay: 'https://stays.example.com/1' },
      })
      .returning({ id: offers.id })
    if (!offer) throw new Error('insert offers nie zwrócił wiersza')
    return offer.id
  }

  function deps(channel: NotificationChannel, now = DAYTIME): NotifyDeps {
    return { db, channels: [channel], log, now: () => now }
  }

  beforeAll(async () => {
    db = await connectTestDb()
  })

  afterAll(async () => {
    for (const id of userIds) await db.delete(users).where(eq(users.id, id))
    await db.$client.end()
  })

  it('wysyła alert z trasą i ceną na początku, dwoma linkami i zapisuje go w alerts_sent', async () => {
    const { userId, watchId } = await setup()
    const offerId = await insertOffer(watchId)
    const { channel, sent } = recordingChannel()

    const outcomes = await notifyOffer(deps(channel), offerId)

    expect(outcomes).toEqual([{ channel: 'telegram', status: 'sent' }])
    expect(sent).toHaveLength(1)
    expect(sent[0]?.user).toEqual({ id: userId })
    expect(sent[0]?.msg.title.replaceAll(' ', ' ')).toBe(
      'POZ → BCN, 16–18.10: 1 186 zł/os. (314 zł poniżej budżetu)',
    )
    expect(sent[0]?.msg.body).toContain('Cena z 29.09, 18:40 · może się zmienić')
    expect(sent[0]?.msg.links).toEqual({
      flight: 'https://flights.example.com/1',
      stay: 'https://stays.example.com/1',
    })

    const recorded = await db.select().from(alertsSent).where(eq(alertsSent.watchId, watchId))
    expect(recorded).toEqual([
      expect.objectContaining({
        channel: 'telegram',
        offerFingerprint: 'POZ-BCN|2026-10-16|2026-10-18',
        totalMinor: 118_600,
        currency: 'PLN',
        sentAt: DAYTIME,
        providerReceiptId: 'tg-101',
      }),
    ])
  })

  it('nie wysyła drugi raz tego samego wyjazdu w podobnej cenie', async () => {
    const { watchId } = await setup()
    const { channel, sent } = recordingChannel()
    await notifyOffer(deps(channel), await insertOffer(watchId))

    const outcomes = await notifyOffer(deps(channel), await insertOffer(watchId, 400))

    expect(outcomes).toEqual([{ channel: 'telegram', status: 'skipped', reason: 'duplicate' }])
    expect(sent).toHaveLength(1)
  })

  it('wysyła ponownie, gdy cena tego samego wyjazdu spadła o co najmniej 5%', async () => {
    const { watchId } = await setup()
    const { channel, sent } = recordingChannel()
    await notifyOffer(deps(channel), await insertOffer(watchId))

    // 1186 zł → 1086 zł (−8,4%)
    const outcomes = await notifyOffer(deps(channel), await insertOffer(watchId, 312))

    expect(outcomes).toEqual([{ channel: 'telegram', status: 'sent' }])
    expect(sent).toHaveLength(2)
  })

  it('w quiet hours odkłada wysyłkę do ich końca i niczego nie zapisuje', async () => {
    const { watchId } = await setup()
    const { channel, sent } = recordingChannel()
    // 21:00 UTC = 23:00 w Warszawie → do 07:00 zostało 8 h
    const lateEvening = new Date('2026-09-29T21:00:00Z')

    const outcomes = await notifyOffer(deps(channel, lateEvening), await insertOffer(watchId))

    expect(outcomes).toEqual([{ channel: 'telegram', status: 'deferred', minutes: 480 }])
    expect(sent).toEqual([])
    expect(await db.select().from(alertsSent).where(eq(alertsSent.watchId, watchId))).toEqual([])
  })

  it('po dziennym limicie alertów na kanał pomija kolejne', async () => {
    const { watchId } = await setup()
    await db.insert(alertsSent).values(
      [
        'POZ-BCN|2026-10-01|2026-10-03',
        'POZ-BCN|2026-10-02|2026-10-04',
        'POZ-BCN|2026-10-09|2026-10-11',
      ].map((offerFingerprint, i) => ({
        watchId,
        channel: 'telegram' as const,
        offerFingerprint,
        totalMinor: 120_000,
        currency: 'PLN',
        sentAt: new Date(DAYTIME.getTime() - (i + 1) * 3_600_000),
      })),
    )
    const { channel, sent } = recordingChannel()

    const outcomes = await notifyOffer(deps(channel), await insertOffer(watchId))

    expect(outcomes).toEqual([{ channel: 'telegram', status: 'skipped', reason: 'daily-limit' }])
    expect(sent).toEqual([])
  })

  it('pomija wyłączony kanał i kanał, którego worker nie obsługuje', async () => {
    const { userId, watchId } = await setup({ enabled: false })
    await db.insert(notificationPrefs).values({ userId, channel: 'email' })
    const { channel, sent } = recordingChannel()

    const outcomes = await notifyOffer(deps(channel), await insertOffer(watchId))

    expect(outcomes).toEqual([])
    expect(sent).toEqual([])
  })

  it('gdy konto nie jest połączone z kanałem, nie zapisuje alertu jako wysłanego', async () => {
    const { watchId } = await setup()
    const { channel } = recordingChannel({ status: 'not-linked' })

    const outcomes = await notifyOffer(deps(channel), await insertOffer(watchId))

    expect(outcomes).toEqual([{ channel: 'telegram', status: 'not-linked' }])
    expect(await db.select().from(alertsSent).where(eq(alertsSent.watchId, watchId))).toEqual([])
  })

  it('błąd kanału przerywa job (pg-boss ponowi) i nie zapisuje alertu', async () => {
    const { watchId } = await setup()
    const failing: NotificationChannel = {
      id: 'telegram',
      send: async () => {
        throw new Error('HTTP 502')
      },
    }

    await expect(notifyOffer(deps(failing), await insertOffer(watchId))).rejects.toThrow('HTTP 502')
    expect(await db.select().from(alertsSent).where(eq(alertsSent.watchId, watchId))).toEqual([])
  })

  it(
    'job notify w quiet hours tworzy odłożony job dla tego kanału',
    { timeout: 15_000 },
    async () => {
      const { watchId } = await setup()
      const offerId = await insertOffer(watchId)
      const { channel, sent } = recordingChannel()
      const lateEvening = new Date('2026-09-29T21:00:00Z')
      const boss = new PgBoss({ connectionString: testDatabaseUrl, schema: 'pgboss_test_defer' })
      boss.on('error', (err) => log.error('pg-boss error', { err }))
      await boss.start()
      try {
        await registerNotify(boss, deps(channel, lateEvening))
        const jobId = await enqueueNotify(boss, { offerId, watchId })
        if (!jobId) throw new Error('pg-boss nie utworzył joba')

        await vi.waitFor(
          async () => expect((await boss.getJobById(NOTIFY_QUEUE, jobId))?.state).toBe('completed'),
          { timeout: 8_000, interval: 200 },
        )
        const [deferred] = await boss.fetch(NOTIFY_QUEUE, {
          ignoreStartAfter: true,
          includeMetadata: true,
        })
        expect(deferred?.data).toEqual({ offerId, watchId, channel: 'telegram' })
        // startAfter liczone od czasu bazy, nie od sztucznego `now`: ~8 h od teraz
        expect(deferred?.startAfter.getTime()).toBeGreaterThan(Date.now() + 470 * 60_000)
        expect(sent).toEqual([])
      } finally {
        await boss.stop({ graceful: false })
      }
    },
  )

  it('job notify w pg-boss dostarcza alert', { timeout: 15_000 }, async () => {
    const { watchId } = await setup()
    const offerId = await insertOffer(watchId)
    const { channel, sent } = recordingChannel()
    const boss = new PgBoss({ connectionString: testDatabaseUrl, schema: 'pgboss_test_notify' })
    boss.on('error', (err) => log.error('pg-boss error', { err }))
    await boss.start()
    try {
      await registerNotify(boss, deps(channel))
      await enqueueNotify(boss, { offerId, watchId })

      await vi.waitFor(() => expect(sent).toHaveLength(1), { timeout: 8_000, interval: 200 })
    } finally {
      await boss.stop({ graceful: false })
    }
  })
})
