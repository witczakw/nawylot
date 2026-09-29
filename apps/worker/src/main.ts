import { existsSync } from 'node:fs'
import PgBoss from 'pg-boss'
import { registerHeartbeat } from './jobs/heartbeat'
import { createLogger } from './logger'

const rootEnv = new URL('../../../.env', import.meta.url)
if (!process.env.DATABASE_URL && existsSync(rootEnv)) process.loadEnvFile(rootEnv)

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('Brak DATABASE_URL — ustaw go w .env w katalogu głównym.')

const log = createLogger()
const boss = new PgBoss(databaseUrl)
boss.on('error', (err) => log.error('pg-boss error', { err }))

await boss.start()
await registerHeartbeat(boss, log)
// scan-watch (jobs/scanWatch.ts) wymaga adapterów lotów i noclegów — rejestracja tutaj, gdy
// powstaną (BLOKADA M2.2 / M2.4 w NIGHT_LOG.md).
log.info('worker started')

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    log.info('worker stopping', { signal })
    boss.stop({ graceful: true }).then(
      () => log.info('worker stopped'),
      (err: unknown) => {
        log.error('worker stop failed', { err })
        process.exitCode = 1
      },
    )
  })
}
