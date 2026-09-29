import { existsSync } from 'node:fs'
import { createDb } from './client'
import { seed, SEED_USER_ID } from './seed'

if (process.env.NODE_ENV === 'production') {
  throw new Error('Seed tworzy dane testowe — nie uruchamiaj go na produkcji.')
}

const rootEnv = '../../.env'
if (!process.env.DATABASE_URL && existsSync(rootEnv)) process.loadEnvFile(rootEnv)
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('Brak DATABASE_URL — ustaw go w .env w katalogu głównym.')

const db = createDb(databaseUrl)
try {
  await seed(db, new Date().toISOString().slice(0, 10))
  process.stdout.write(`Seed gotowy: użytkownik ${SEED_USER_ID} z 3 watchami POZ → dowolnie.\n`)
} finally {
  await db.$client.end()
}
