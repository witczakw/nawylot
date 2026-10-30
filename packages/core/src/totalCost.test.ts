import { describe, expect, it } from 'vitest'
import { money } from './money'
import { totalCost } from './totalCost'

const pln = (amountMinor: number) => money(amountMinor, 'PLN')

describe('totalCost', () => {
  it('1 osoba, 2 noce: lot 412 zł + nocleg 387 zł/noc = 1186 zł', () => {
    const cost = totalCost({
      flightPerPerson: pln(41_200),
      pax: 1,
      stayPerNight: pln(38_700),
      nights: 2,
      baggagePerPerson: pln(0),
    })

    expect(cost).toEqual({
      flight: pln(41_200),
      stay: pln(77_400),
      baggage: pln(0),
      total: pln(118_600),
      perPerson: pln(118_600),
    })
  })

  it('2 osoby, 3 noce z bagażem: lot i bagaż × osoby, nocleg × noce', () => {
    const cost = totalCost({
      flightPerPerson: pln(35_900),
      pax: 2,
      stayPerNight: pln(42_000),
      nights: 3,
      baggagePerPerson: pln(12_000),
    })

    expect(cost.flight).toEqual(pln(71_800))
    expect(cost.stay).toEqual(pln(126_000))
    expect(cost.baggage).toEqual(pln(24_000))
    expect(cost.total).toEqual(pln(221_800))
    expect(cost.perPerson).toEqual(pln(110_900))
  })

  it('kwota na osobę zaokrąglona w górę do grosza, gdy suma nie dzieli się równo', () => {
    const cost = totalCost({
      flightPerPerson: pln(30_000),
      pax: 3,
      stayPerNight: pln(50_001),
      nights: 1,
      baggagePerPerson: pln(0),
    })

    // 140 001 gr / 3 = 46 667 gr (46 666,33 w górę)
    expect(cost.total).toEqual(pln(140_001))
    expect(cost.perPerson).toEqual(pln(46_667))
  })

  it('odrzuca 0 osób i 0 nocy', () => {
    const base = {
      flightPerPerson: pln(41_200),
      pax: 1,
      stayPerNight: pln(38_700),
      nights: 2,
      baggagePerPerson: pln(0),
    }

    expect(() => totalCost({ ...base, pax: 0 })).toThrow(/pax/)
    expect(() => totalCost({ ...base, nights: 0 })).toThrow(/nights/)
    expect(() => totalCost({ ...base, nights: 2.5 })).toThrow(/nights/)
  })

  it('nie sumuje lotu w EUR z noclegiem w PLN', () => {
    expect(() =>
      totalCost({
        flightPerPerson: money(9_900, 'EUR'),
        pax: 1,
        stayPerNight: pln(38_700),
        nights: 2,
        baggagePerPerson: money(0, 'EUR'),
      }),
    ).toThrow(/EUR i PLN/)
  })
})
