import { notificationPrefs, users, watches } from './schema'
import type { Db } from './client'

export const SEED_USER_ID = '00000000-0000-4000-8000-000000000001'
const SEED_WATCH_IDS = [
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000102',
  '00000000-0000-4000-8000-000000000103',
] as const

// Najbliższy październik, który jeszcze się nie skończył.
export function upcomingOctober(today: string): { dateFrom: string; dateTo: string } {
  const year = Number(today.slice(0, 4))
  const octoberYear = today > `${year}-10-31` ? year + 1 : year
  return { dateFrom: `${octoberYear}-10-01`, dateTo: `${octoberYear}-10-31` }
}

// Trzy watche z TASKS.md: POZ → dowolnie, październik, 2–3 noce, 1000 zł/os.
// Różnią się tylko liczbą osób, żeby było widać koszt liczony na osobę.
export function seedWatches(today: string): (typeof watches.$inferInsert)[] {
  const october = upcomingOctober(today)
  return SEED_WATCH_IDS.map((id, i) => ({
    id,
    userId: SEED_USER_ID,
    origins: ['POZ'],
    destinations: null,
    ...october,
    nightsMin: 2,
    nightsMax: 3,
    pax: [1, 2, 4][i] ?? 1,
    budgetMinor: 100_000,
    currency: 'PLN',
    active: true,
  }))
}

export async function seed(db: Db, today: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .insert(users)
      .values({ id: SEED_USER_ID, timezone: 'Europe/Warsaw' })
      .onConflictDoNothing()
    await tx
      .insert(notificationPrefs)
      .values({
        userId: SEED_USER_ID,
        channel: 'telegram',
        enabled: true,
        quietHoursFrom: '22:00',
        quietHoursTo: '07:00',
      })
      .onConflictDoNothing()
    for (const watch of seedWatches(today)) {
      // Ponowny seed przesuwa daty na kolejny październik i włącza watch z powrotem.
      await tx
        .insert(watches)
        .values(watch)
        .onConflictDoUpdate({
          target: watches.id,
          set: {
            dateFrom: watch.dateFrom,
            dateTo: watch.dateTo,
            active: true,
            lastScannedAt: null,
          },
        })
    }
  })
}
