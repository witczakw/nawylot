import { describe, expect, it } from 'vitest'
import { formatFetchedAt, formatMoney, formatTripDates, nightsLabel } from './format'
import { money } from './money'

// Intl rozdziela tysiące i walutę spacją niełamiącą (U+00A0).
const nbsp = (text: string) => text.replaceAll(' ', ' ')

describe('formatMoney', () => {
  it('pokazuje złotówki bez groszy, z odstępem tysięcy', () => {
    expect(formatMoney(money(118_600, 'PLN'))).toBe(nbsp('1 186 zł'))
  })

  it('zaokrągla grosze do pełnych złotych', () => {
    expect(formatMoney(money(31_449, 'PLN'))).toBe(nbsp('314 zł'))
    expect(formatMoney(money(31_450, 'PLN'))).toBe(nbsp('315 zł'))
  })

  it('obsługuje inne waluty', () => {
    expect(formatMoney(money(118_600, 'EUR'))).toBe(nbsp('1 186 €'))
  })
})

describe('formatTripDates', () => {
  it('ten sam miesiąc: 16–18.10', () => {
    expect(formatTripDates('2026-10-16', '2026-10-18')).toBe('16–18.10')
  })

  it('przełom miesięcy: 30.10–2.11', () => {
    expect(formatTripDates('2026-10-30', '2026-11-02')).toBe('30.10–2.11')
  })

  it('przełom lat z rokiem', () => {
    expect(formatTripDates('2026-12-30', '2027-01-02')).toBe('30.12.2026–2.01.2027')
  })
})

describe('formatFetchedAt', () => {
  it('pokazuje czas w strefie użytkownika, nie w UTC', () => {
    expect(formatFetchedAt(new Date('2026-09-29T19:40:00Z'), 'Europe/Warsaw')).toBe('29.09, 21:40')
  })

  it('uwzględnia zmianę czasu (listopad: UTC+1)', () => {
    expect(formatFetchedAt(new Date('2026-11-03T20:40:00Z'), 'Europe/Warsaw')).toBe('03.11, 21:40')
  })
})

describe('nightsLabel', () => {
  it('odmienia noce po polsku', () => {
    expect([1, 2, 4, 5, 12, 14, 22].map(nightsLabel)).toEqual([
      '1 noc',
      '2 noce',
      '4 noce',
      '5 nocy',
      '12 nocy',
      '14 nocy',
      '22 noce',
    ])
  })
})
