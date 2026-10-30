import { describe, expect, it } from 'vitest'
import {
  MAX_ALERTS_PER_USER_PER_DAY,
  decideDelivery,
  isDeal,
  offerFingerprint,
  quietHoursRemaining,
  type DeliveryInput,
} from './alertPolicy'
import { money } from './money'

const pln = (zl: number) => money(zl * 100, 'PLN')

describe('isDeal', () => {
  it('2 osoby, 1552 zł przy budżecie 1500 zł/os. i neutralnym score — okazja', () => {
    expect(isDeal({ total: pln(1552), pax: 2, budgetPerPerson: pln(1500), score: 0 })).toBe(true)
  })

  it('koszt ponad budżet — nie', () => {
    expect(isDeal({ total: pln(3001), pax: 2, budgetPerPerson: pln(1500), score: 30 })).toBe(false)
  })

  it('koszt równy budżetowi — tak', () => {
    expect(isDeal({ total: pln(3000), pax: 2, budgetPerPerson: pln(1500), score: 0 })).toBe(true)
  })

  it('w budżecie, ale drożej niż zwykle na tej trasie (score ujemny) — nie', () => {
    expect(isDeal({ total: pln(900), pax: 1, budgetPerPerson: pln(1500), score: -12 })).toBe(false)
  })
})

describe('offerFingerprint', () => {
  it('ten sam wyjazd ma ten sam odcisk, inne daty — inny', () => {
    const trip = {
      origin: 'POZ',
      destination: 'BCN',
      outboundDate: '2026-10-16',
      returnDate: '2026-10-18',
    }

    expect(offerFingerprint(trip)).toBe(offerFingerprint({ ...trip }))
    expect(offerFingerprint({ ...trip, returnDate: '2026-10-19' })).not.toBe(offerFingerprint(trip))
  })
})

describe('quietHoursRemaining', () => {
  const warsaw = 'Europe/Warsaw'

  it('bez ustawionych quiet hours — 0', () => {
    expect(quietHoursRemaining(new Date('2026-09-29T21:30:00Z'), warsaw, null, null)).toBe(0)
  })

  it('23:30 czasu polskiego przy 22:00–07:00: zostało 7 h 30 min', () => {
    // 21:30 UTC = 23:30 w Warszawie (UTC+2 we wrześniu)
    expect(
      quietHoursRemaining(new Date('2026-09-29T21:30:00Z'), warsaw, '22:00:00', '07:00:00'),
    ).toBe(450)
  })

  it('06:50 czasu polskiego przy 22:00–07:00: zostało 10 min', () => {
    expect(quietHoursRemaining(new Date('2026-09-30T04:50:00Z'), warsaw, '22:00', '07:00')).toBe(10)
  })

  it('07:00 czasu polskiego — quiet hours już się skończyły', () => {
    expect(quietHoursRemaining(new Date('2026-09-30T05:00:00Z'), warsaw, '22:00', '07:00')).toBe(0)
  })

  it('przedział w ciągu dnia (13:00–15:00)', () => {
    expect(quietHoursRemaining(new Date('2026-09-30T12:00:00Z'), warsaw, '13:00', '15:00')).toBe(60)
    expect(quietHoursRemaining(new Date('2026-09-30T14:00:00Z'), warsaw, '13:00', '15:00')).toBe(0)
  })

  it('liczy w strefie użytkownika, nie w UTC', () => {
    // 22:30 UTC to 23:30 w Londynie (czas letni), ale już 00:30 w Warszawie.
    const now = new Date('2026-09-29T22:30:00Z')

    expect(quietHoursRemaining(now, 'Europe/London', '00:00', '07:00')).toBe(0)
    expect(quietHoursRemaining(now, warsaw, '00:00', '07:00')).toBe(390)
  })
})

describe('decideDelivery', () => {
  const base: DeliveryInput = {
    now: new Date('2026-09-29T17:00:00Z'),
    timeZone: 'Europe/Warsaw',
    quietHoursFrom: '22:00:00',
    quietHoursTo: '07:00:00',
    alertsSentLast24h: 0,
    previouslyAlerted: null,
    total: pln(1186),
  }

  it('nowa okazja w ciągu dnia — wyślij', () => {
    expect(decideDelivery(base)).toEqual({ action: 'send' })
  })

  it('ten sam wyjazd po tej samej cenie — pomiń jako duplikat', () => {
    expect(decideDelivery({ ...base, previouslyAlerted: pln(1186) })).toEqual({
      action: 'skip',
      reason: 'duplicate',
    })
  })

  it('spadek o mniej niż 5% — nadal duplikat', () => {
    expect(decideDelivery({ ...base, previouslyAlerted: pln(1240), total: pln(1186) })).toEqual({
      action: 'skip',
      reason: 'duplicate',
    })
  })

  it('spadek o co najmniej 5% — wyślij ponownie', () => {
    expect(decideDelivery({ ...base, previouslyAlerted: pln(1300), total: pln(1235) })).toEqual({
      action: 'send',
    })
  })

  it(`po ${MAX_ALERTS_PER_USER_PER_DAY} alertach w ciągu doby — pomiń`, () => {
    expect(decideDelivery({ ...base, alertsSentLast24h: MAX_ALERTS_PER_USER_PER_DAY })).toEqual({
      action: 'skip',
      reason: 'daily-limit',
    })
  })

  it('w quiet hours — odłóż do ich końca', () => {
    // 21:00 UTC = 23:00 w Warszawie → do 07:00 zostało 8 h
    expect(decideDelivery({ ...base, now: new Date('2026-09-29T21:00:00Z') })).toEqual({
      action: 'defer',
      minutes: 480,
    })
  })

  it('duplikat w quiet hours od razu pomija, nie odkłada', () => {
    expect(
      decideDelivery({
        ...base,
        now: new Date('2026-09-29T21:00:00Z'),
        previouslyAlerted: pln(1186),
      }),
    ).toEqual({ action: 'skip', reason: 'duplicate' })
  })
})
