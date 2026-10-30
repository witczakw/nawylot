import type PgBoss from 'pg-boss'
import type { Logger } from '../logger'

export const HEARTBEAT_QUEUE = 'heartbeat'
export const HEARTBEAT_CRON = '* * * * *'

export async function registerHeartbeat(boss: PgBoss, log: Logger): Promise<void> {
  await boss.createQueue(HEARTBEAT_QUEUE)
  await boss.schedule(HEARTBEAT_QUEUE, HEARTBEAT_CRON)
  await boss.work(HEARTBEAT_QUEUE, async (jobs) => {
    for (const job of jobs) log.info('heartbeat', { jobId: job.id })
  })
}
