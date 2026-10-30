import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Db } from './client'
import { notificationPrefs, users, watches } from './schema'
import { SEED_USER_ID, seed, upcomingOctober } from './seed'
import { connectTestDb, testDatabaseUrl } from './testing'

describe('upcomingOctober', () => {
  it('pod koniec września bierze październik tego roku', () => {
    expect(upcomingOctober('2026-09-29')).toEqual({
      dateFrom: '2026-10-01',
      dateTo: '2026-10-31',
    })
  })

  it('w trakcie października zostaje przy bieżącym', () => {
    expect(upcomingOctober('2026-10-31').dateFrom).toBe('2026-10-01')
  })

  it('po październiku bierze kolejny rok', () => {
    expect(upcomingOctober('2026-11-01')).toEqual({
      dateFrom: '2027-10-01',
      dateTo: '2027-10-31',
    })
  })
})

describe.skipIf(!testDatabaseUrl)('seed na Postgresie', () => {
  let db: Db

  beforeAll(async () => {
    db = await connectTestDb()
    await db.delete(users).where(eq(users.id, SEED_USER_ID))
  })

  afterAll(async () => {
    await db.delete(users).where(eq(users.id, SEED_USER_ID))
    await db.$client.end()
  })

  it('tworzy użytkownika z Telegramem i 3 watche POZ → dowolnie, październik, 2–3 noce, 1000 zł/os.', async () => {
    await seed(db, '2026-09-29')

    const seeded = await db
      .select()
      .from(watches)
      .where(eq(watches.userId, SEED_USER_ID))
      .orderBy(watches.pax)
    expect(seeded).toHaveLength(3)
    for (const watch of seeded) {
      expect(watch).toMatchObject({
        origins: ['POZ'],
        destinations: null,
        dateFrom: '2026-10-01',
        dateTo: '2026-10-31',
        nightsMin: 2,
        nightsMax: 3,
        budgetMinor: 100_000,
        currency: 'PLN',
        active: true,
      })
    }
    expect(seeded.map((w) => w.pax)).toEqual([1, 2, 4])

    const prefs = await db
      .select()
      .from(notificationPrefs)
      .where(eq(notificationPrefs.userId, SEED_USER_ID))
    expect(prefs).toEqual([
      expect.objectContaining({
        channel: 'telegram',
        enabled: true,
        quietHoursFrom: '22:00:00',
        quietHoursTo: '07:00:00',
      }),
    ])
  })

  it('ponowny seed nie dubluje danych i przesuwa daty na kolejny październik', async () => {
    await seed(db, '2026-09-29')
    await db
      .update(watches)
      .set({ active: false, lastScannedAt: new Date('2026-10-20T10:00:00Z') })
      .where(eq(watches.userId, SEED_USER_ID))

    await seed(db, '2026-11-15')

    const seeded = await db.select().from(watches).where(eq(watches.userId, SEED_USER_ID))
    expect(seeded).toHaveLength(3)
    expect(seeded.every((w) => w.dateFrom === '2027-10-01' && w.active)).toBe(true)
    expect(seeded.every((w) => w.lastScannedAt === null)).toBe(true)
    expect(await db.select().from(users).where(eq(users.id, SEED_USER_ID))).toHaveLength(1)
  })
})
