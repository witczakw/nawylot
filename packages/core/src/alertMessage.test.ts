import { describe, expect, it } from 'vitest'
import { buildAlertMessage, type AlertInput } from './alertMessage'
import { money } from './money'
import { totalCost } from './totalCost'

const pln = (zl: number) => money(zl * 100, 'PLN')
const plain = (text: string) => text.replaceAll(' ', ' ')

function input(overrides: Partial<AlertInput> = {}): AlertInput {
  return {
    offerId: 'offer-1',
    origin: 'POZ',
    destination: 'BCN',
    outboundDate: '2026-10-16',
    returnDate: '2026-10-18',
    pax: 1,
    nights: 2,
    cost: totalCost({
      flightPerPerson: pln(412),
      pax: 1,
      stayPerNight: pln(387),
      nights: 2,
      baggagePerPerson: pln(0),
    }),
    budgetPerPerson: pln(1500),
    fetchedAt: new Date('2026-09-29T19:40:00Z'),
    timeZone: 'Europe/Warsaw',
    links: { flight: 'https://flights.example.com/1', stay: 'https://stays.example.com/1' },
    ...overrides,
  }
}

describe('buildAlertMessage', () => {
  it('zaczyna się od trasy i ceny, jak w ANTI_SLOP.md', () => {
    const msg = buildAlertMessage(input())

    expect(plain(msg.title)).toBe('POZ → BCN, 16–18.10: 1 186 zł/os. (314 zł poniżej budżetu)')
  })

  it('podaje rozbicie kosztu i datę pobrania ceny w strefie użytkownika', () => {
    const msg = buildAlertMessage(input())

    expect(plain(msg.body)).toBe(
      'Lot 412 zł + nocleg 774 zł (2 noce)\nCena z 29.09, 21:40 · może się zmienić',
    )
  })

  it('dla 2 osób pokazuje cenę na osobę w tytule i sumę za wszystkich w treści', () => {
    const cost = totalCost({
      flightPerPerson: pln(389),
      pax: 2,
      stayPerNight: pln(387),
      nights: 2,
      baggagePerPerson: pln(0),
    })

    const msg = buildAlertMessage(input({ pax: 2, cost }))

    expect(plain(msg.title)).toBe('POZ → BCN, 16–18.10: 776 zł/os. (724 zł poniżej budżetu)')
    expect(plain(msg.body.split('\n')[0] ?? '')).toBe(
      'Za 2 os.: lot 778 zł + nocleg 774 zł (2 noce) = 1 552 zł',
    )
  })

  it('pokazuje szacunek bagażu, gdy jest większy od zera', () => {
    const cost = totalCost({
      flightPerPerson: pln(412),
      pax: 1,
      stayPerNight: pln(387),
      nights: 2,
      baggagePerPerson: pln(120),
    })

    const msg = buildAlertMessage(input({ cost }))

    expect(plain(msg.body.split('\n')[0] ?? '')).toBe(
      'Lot 412 zł + nocleg 774 zł (2 noce) + bagaż 120 zł',
    )
  })

  it('kwota równa budżetowi: „mieści się w budżecie” zamiast „0 zł poniżej”', () => {
    const msg = buildAlertMessage(input({ budgetPerPerson: pln(1186) }))

    expect(plain(msg.title)).toContain('(mieści się w budżecie)')
  })

  it('tytuł mieści się w 120 znakach także przy długiej kwocie i przełomie lat', () => {
    const cost = totalCost({
      flightPerPerson: pln(12_345),
      pax: 1,
      stayPerNight: pln(9_999),
      nights: 3,
      baggagePerPerson: pln(0),
    })

    const msg = buildAlertMessage(
      input({
        outboundDate: '2026-12-30',
        returnDate: '2027-01-02',
        nights: 3,
        cost,
        budgetPerPerson: pln(99_999),
      }),
    )

    expect(msg.title.length).toBeLessThanOrEqual(120)
  })

  it('przekazuje osobne linki do lotu i noclegu oraz datę pobrania', () => {
    const msg = buildAlertMessage(input())

    expect(msg.links).toEqual({
      flight: 'https://flights.example.com/1',
      stay: 'https://stays.example.com/1',
    })
    expect(msg.fetchedAt).toEqual(new Date('2026-09-29T19:40:00Z'))
    expect(msg.offerId).toBe('offer-1')
  })

  it('nie używa zwrotów z listy zakazanych ani wykrzykników', () => {
    const msg = buildAlertMessage(input())
    const text = `${msg.title}\n${msg.body}`.toLowerCase()

    for (const banned of [
      'odkryj',
      'przygod',
      'magi',
      'bezproblemow',
      'idealn',
      'perfekcyjn',
      '!',
    ]) {
      expect(text).not.toContain(banned)
    }
  })
})
