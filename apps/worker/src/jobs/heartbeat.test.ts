import PgBoss from 'pg-boss'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createLogger } from '../logger'
import { HEARTBEAT_CRON, HEARTBEAT_QUEUE, registerHeartbeat } from './heartbeat'

const testDatabaseUrl = process.env.TEST_DATABASE_URL

describe.skipIf(!testDatabaseUrl)('heartbeat na pg-boss (Postgres)', () => {
  const lines: string[] = []
  const log = createLogger((line) => lines.push(line))
  let boss: PgBoss

  beforeAll(async () => {
    boss = new PgBoss({ connectionString: testDatabaseUrl, schema: 'pgboss_test' })
    boss.on('error', (err) => log.error('pg-boss error', { err }))
    await boss.start()
    await registerHeartbeat(boss, log)
  })

  afterAll(async () => {
    await boss.stop({ graceful: false })
  })

  it('planuje heartbeat co minutę', async () => {
    const schedules = await boss.getSchedules()

    expect(schedules).toContainEqual(
      expect.objectContaining({ name: HEARTBEAT_QUEUE, cron: HEARTBEAT_CRON }),
    )
  })

  it('przetwarza job heartbeat i loguje jego id', { timeout: 15_000 }, async () => {
    const jobId = await boss.send(HEARTBEAT_QUEUE, {})

    await vi.waitFor(
      () => {
        const logged = lines.map((line) => JSON.parse(line) as Record<string, unknown>)
        expect(logged).toContainEqual(expect.objectContaining({ msg: 'heartbeat', jobId }))
      },
      { timeout: 8_000, interval: 200 },
    )
  })
})
