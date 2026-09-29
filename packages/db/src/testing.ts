import { createDb, runMigrations, type Db } from './client'

export const testDatabaseUrl = process.env.TEST_DATABASE_URL

// Testy kilku pakietów startują równolegle; blokada doradcza serializuje migracje.
const MIGRATION_LOCK_KEY = 7_202_609

export async function connectTestDb(): Promise<Db> {
  if (!testDatabaseUrl) throw new Error('Brak TEST_DATABASE_URL — ustaw adres bazy testowej.')
  const db = createDb(testDatabaseUrl)
  const lockClient = await db.$client.connect()
  try {
    await lockClient.query('select pg_advisory_lock($1)', [MIGRATION_LOCK_KEY])
    await runMigrations(db)
  } finally {
    await lockClient.query('select pg_advisory_unlock($1)', [MIGRATION_LOCK_KEY])
    lockClient.release()
  }
  return db
}
