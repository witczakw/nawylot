import { describe, expect, it } from 'vitest'
import { addDays, daysBetween } from './dates'

describe('addDays', () => {
  it('przechodzi przez koniec miesiąca', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02')
  })

  it('nie gubi dnia przy zmianie czasu 25.10.2026', () => {
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26')
  })

  it('zna 29 lutego w roku przestępnym', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01')
  })

  it('odrzuca nieistniejące daty i zły format', () => {
    expect(() => addDays('2026-02-30', 1)).toThrow(RangeError)
    expect(() => addDays('17.10.2026', 1)).toThrow(RangeError)
    expect(() => addDays('2026-10-17T00:00:00Z', 1)).toThrow(RangeError)
  })
})

describe('daysBetween', () => {
  it('pt 17.10 – nd 19.10 to 2 noce', () => {
    expect(daysBetween('2026-10-17', '2026-10-19')).toBe(2)
  })

  it('jest ujemne, gdy druga data jest wcześniejsza', () => {
    expect(daysBetween('2026-10-19', '2026-10-17')).toBe(-2)
  })
})
