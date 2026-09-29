import { describe, expect, it } from 'vitest'
import {
  DAILY_QUERY_BUDGET_PER_WATCH,
  DEFAULT_SCAN_INTERVAL_MINUTES,
  MAX_STAY_QUERIES_PER_SCAN,
  isScanDue,
  scanBudget,
  scanIndex,
} from './limits'

const HOUR = 60

describe('scanBudget', () => {
  it('plan „Na próbę” (skan co 24 h) dostaje cały dobowy budżet w jednym skanie', () => {
    expect(scanBudget(DEFAULT_SCAN_INTERVAL_MINUTES)).toEqual({
      flightQueries: DAILY_QUERY_BUDGET_PER_WATCH - MAX_STAY_QUERIES_PER_SCAN,
      stayQueries: MAX_STAY_QUERIES_PER_SCAN,
    })
  })

  it('skan co 3 h dzieli budżet 24 zapytań na 8 skanów po 3', () => {
    expect(scanBudget(3 * HOUR, 24)).toEqual({ flightQueries: 2, stayQueries: 1 })
  })

  it('interwał, który nie dzieli doby równo, liczy skany w górę (co 5 h = 5 skanów)', () => {
    expect(scanBudget(5 * HOUR, 24)).toEqual({ flightQueries: 2, stayQueries: 2 })
  })

  it('większy budżet przy skanie co godzinę: 240 / 24 = 10 zapytań na skan', () => {
    expect(scanBudget(HOUR, 240)).toEqual({ flightQueries: 7, stayQueries: 3 })
  })

  it('odrzuca budżet, który nie starcza na lot i nocleg w każdym skanie', () => {
    expect(() => scanBudget(HOUR, 24)).toThrow(/nie starcza/)
  })

  it('suma zapytań w ciągu doby nigdy nie przekracza budżetu', () => {
    for (const interval of [60, 90, 180, 300, 360, 720, 1440]) {
      const budget = scanBudget(interval, 120)
      const scansPerDay = Math.ceil(1440 / interval)

      expect((budget.flightQueries + budget.stayQueries) * scansPerDay).toBeLessThanOrEqual(120)
    }
  })

  it('odrzuca zerowy albo ułamkowy interwał', () => {
    expect(() => scanBudget(0)).toThrow(/scanIntervalMinutes/)
    expect(() => scanBudget(90.5)).toThrow(/scanIntervalMinutes/)
  })
})

describe('isScanDue', () => {
  const now = new Date('2026-10-02T22:00:00Z')

  it('nigdy nieskanowany watch jest do skanu od razu', () => {
    expect(isScanDue(null, now, DEFAULT_SCAN_INTERVAL_MINUTES)).toBe(true)
  })

  it('skan sprzed 23 h 59 min przy interwale 24 h — jeszcze nie', () => {
    expect(isScanDue(new Date('2026-10-01T22:01:00Z'), now, 24 * HOUR)).toBe(false)
  })

  it('skan sprzed równo 24 h — tak', () => {
    expect(isScanDue(new Date('2026-10-01T22:00:00Z'), now, 24 * HOUR)).toBe(true)
  })
})

describe('scanIndex', () => {
  it('kolejne doby dają kolejne numery skanu przy interwale 24 h', () => {
    const monday = scanIndex(new Date('2026-10-05T08:00:00Z'), 24 * HOUR)
    const tuesday = scanIndex(new Date('2026-10-06T08:00:00Z'), 24 * HOUR)

    expect(tuesday - monday).toBe(1)
  })

  it('w obrębie jednego okna numer się nie zmienia', () => {
    expect(scanIndex(new Date('2026-10-05T00:10:00Z'), 24 * HOUR)).toBe(
      scanIndex(new Date('2026-10-05T23:50:00Z'), 24 * HOUR),
    )
  })
})
