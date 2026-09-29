import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Db } from './client'
import { offers, users, watches } from './schema'
import { connectTestDb, testDatabaseUrl } from './testing'

async function insertUser(db: Db): Promise<string> {
  const [user] = await db.insert(users).values({}).returning({ id: users.id })
  if (!user) throw new Error('insert users nie zwrócił wiersza')
  return user.id
}

const octoberWeekends = {
  origins: ['POZ'],
  destinations: null,
  dateFrom: '2026-10-01',
  dateTo: '2026-10-31',
  nightsMin: 2,
  nightsMax: 3,
  pax: 1,
  budgetMinor: 100_000,
  currency: 'PLN',
}

describe.skipIf(!testDatabaseUrl)('schema na Postgresie', () => {
  let db: Db
  const createdUserIds: string[] = []

  beforeAll(async () => {
    db = await connectTestDb()
  })

  afterAll(async () => {
    for (const id of createdUserIds) await db.delete(users).where(eq(users.id, id))
    await db.$client.end()
  })

  it('zapisuje watch „dowolnie” i zwraca daty jako YYYY-MM-DD', async () => {
    const userId = await insertUser(db)
    createdUserIds.push(userId)

    const [watch] = await db
      .insert(watches)
      .values({ ...octoberWeekends, userId })
      .returning()

    expect(watch).toMatchObject({
      origins: ['POZ'],
      destinations: null,
      dateFrom: '2026-10-01',
      dateTo: '2026-10-31',
      budgetMinor: 100_000,
      currency: 'PLN',
      active: true,
      lastScannedAt: null,
    })
  })

  it('odrzuca watch z nights_min większym niż nights_max', async () => {
    const userId = await insertUser(db)
    createdUserIds.push(userId)

    await expect(
      db.insert(watches).values({ ...octoberWeekends, userId, nightsMin: 4, nightsMax: 2 }),
    ).rejects.toMatchObject({ cause: { constraint: 'watches_nights_range' } })
  })

  it('odrzuca watch bez lotniska wylotu', async () => {
    const userId = await insertUser(db)
    createdUserIds.push(userId)

    await expect(
      db.insert(watches).values({ ...octoberWeekends, userId, origins: [] }),
    ).rejects.toMatchObject({ cause: { constraint: 'watches_origins_not_empty' } })
  })

  it('usunięcie użytkownika usuwa jego watche i oferty', async () => {
    const userId = await insertUser(db)
    const [watch] = await db
      .insert(watches)
      .values({ ...octoberWeekends, userId })
      .returning({ id: watches.id })
    if (!watch) throw new Error('insert watches nie zwrócił wiersza')
    await db.insert(offers).values({
      watchId: watch.id,
      flightJson: {},
      stayJson: {},
      totalMinor: 118_600,
      currency: 'PLN',
      score: 0,
      fetchedAt: new Date('2026-09-29T19:40:00Z'),
      deepLinks: { flight: 'https://example.com/lot', stay: 'https://example.com/nocleg' },
    })

    await db.delete(users).where(eq(users.id, userId))

    expect(await db.select().from(watches).where(eq(watches.userId, userId))).toEqual([])
    expect(await db.select().from(offers).where(eq(offers.watchId, watch.id))).toEqual([])
  })
})
