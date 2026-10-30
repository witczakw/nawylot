import { describe, expect, it } from 'vitest'
import { createLogger } from './logger'

function capture() {
  const lines: string[] = []
  const log = createLogger((line) => lines.push(line))
  const entries = () => lines.map((line) => JSON.parse(line) as Record<string, unknown>)
  return { log, entries }
}

describe('createLogger', () => {
  it('pisze jedną linię JSON z czasem ISO, poziomem, treścią i polami', () => {
    const { log, entries } = capture()

    log.info('heartbeat', { jobId: 'abc' })

    expect(entries()).toEqual([
      {
        time: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.*Z$/),
        level: 'info',
        msg: 'heartbeat',
        jobId: 'abc',
      },
    ])
  })

  it('zamienia Error na nazwę, komunikat i stos, zamiast gubić go jako {}', () => {
    const { log, entries } = capture()

    log.error('pg-boss error', { err: new TypeError('connection refused') })

    expect(entries()[0]).toMatchObject({
      level: 'error',
      err: { name: 'TypeError', message: 'connection refused', stack: expect.any(String) },
    })
  })

  it('pole z kluczem „level” nie nadpisuje poziomu wpisu', () => {
    const { log, entries } = capture()

    log.warn('quiet hours', { level: 'info' })

    expect(entries()[0]).toMatchObject({ level: 'warn' })
  })
})
