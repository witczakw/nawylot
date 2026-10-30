import { describe, expect, it } from 'vitest'
import { expandWatch, type FlightQuery, type WatchSearch } from './expandWatch'

// Seed z TASKS.md: POZ → dowolnie, październik, 2–3 noce.
const pozOctober: WatchSearch = {
  origins: ['POZ'],
  destinations: null,
  dateFrom: '2026-10-01',
  dateTo: '2026-10-31',
  nightsMin: 2,
  nightsMax: 3,
}

const key = (q: FlightQuery) => `${q.origin}-${q.destination}-${q.outboundDate}-${q.nights}`

describe('expandWatch', () => {
  it('październik, 2–3 noce: 29 wylotów na 2 noce + 28 na 3 noce, powrót najpóźniej 31.10', () => {
    const { queries, total } = expandWatch(pozOctober, { today: '2026-09-29', limit: 1000 })

    expect(total).toBe(57)
    expect(queries).toHaveLength(57)
    expect(queries[0]).toEqual({
      origin: 'POZ',
      destination: null,
      outboundDate: '2026-10-01',
      returnDate: '2026-10-03',
      nights: 2,
    })
    expect(queries.at(-1)).toEqual({
      origin: 'POZ',
      destination: null,
      outboundDate: '2026-10-29',
      returnDate: '2026-10-31',
      nights: 2,
    })
    expect(queries.every((q) => q.returnDate <= '2026-10-31')).toBe(true)
  })

  it('pomija wyloty z datą w przeszłości', () => {
    const { queries } = expandWatch(pozOctober, { today: '2026-10-27', limit: 1000 })

    expect(queries.map((q) => `${q.outboundDate}/${q.nights}`)).toEqual([
      '2026-10-27/2',
      '2026-10-27/3',
      '2026-10-28/2',
      '2026-10-28/3',
      '2026-10-29/2',
    ])
  })

  it('nie zwraca nic, gdy okno dat już minęło', () => {
    expect(expandWatch(pozOctober, { today: '2026-11-01', limit: 1000 })).toEqual({
      queries: [],
      total: 0,
    })
  })

  it('nie zwraca nic, gdy okno jest krótsze niż minimalna liczba nocy', () => {
    const weekend = { ...pozOctober, dateFrom: '2026-10-17', dateTo: '2026-10-18' }

    expect(expandWatch(weekend, { today: '2026-09-29', limit: 1000 }).total).toBe(0)
  })

  it('rozwija wszystkie lotniska wylotu i cele', () => {
    const watch: WatchSearch = {
      origins: ['POZ', 'WRO'],
      destinations: ['BCN', 'LIS'],
      dateFrom: '2026-10-16',
      dateTo: '2026-10-18',
      nightsMin: 2,
      nightsMax: 2,
    }

    const { queries } = expandWatch(watch, { today: '2026-09-29', limit: 1000 })

    expect(queries.map((q) => `${q.origin}→${q.destination}`)).toEqual([
      'POZ→BCN',
      'POZ→LIS',
      'WRO→BCN',
      'WRO→LIS',
    ])
  })

  it('powrót może wypaść w kolejnym miesiącu, jeśli okno na to pozwala', () => {
    const watch = { ...pozOctober, dateFrom: '2026-10-30', dateTo: '2026-11-02', nightsMin: 3 }

    const { queries } = expandWatch(watch, { today: '2026-09-29', limit: 1000 })

    expect(queries).toEqual([
      {
        origin: 'POZ',
        destination: null,
        outboundDate: '2026-10-30',
        returnDate: '2026-11-02',
        nights: 3,
      },
    ])
  })

  it('przy limicie bierze pierwsze zapytania w pierwszym skanie', () => {
    const { queries, total } = expandWatch(pozOctober, { today: '2026-09-29', limit: 21 })

    expect(total).toBe(57)
    expect(queries).toHaveLength(21)
    expect(queries[0]?.outboundDate).toBe('2026-10-01')
  })

  it('kolejne skany biorą kolejne okna i po 3 skanach pokrywają cały październik', () => {
    const scans = [0, 1, 2].map(
      (scanIndex) => expandWatch(pozOctober, { today: '2026-09-29', limit: 21, scanIndex }).queries,
    )
    const all = expandWatch(pozOctober, { today: '2026-09-29', limit: 1000 }).queries

    expect(scans[1]?.[0]).toEqual(all[21])
    expect(new Set(scans.flat().map(key))).toEqual(new Set(all.map(key)))
  })

  it('zawija na początek listy, gdy okno wychodzi poza koniec', () => {
    const all = expandWatch(pozOctober, { today: '2026-09-29', limit: 1000 }).queries

    // skan 2: start 42, bierze 42..56 i 0..5
    const { queries } = expandWatch(pozOctober, { today: '2026-09-29', limit: 21, scanIndex: 2 })

    expect(queries[14]).toEqual(all[56])
    expect(queries[15]).toEqual(all[0])
  })

  it('limit 0 nie zwraca zapytań, ujemny lub ułamkowy limit albo numer skanu to błąd', () => {
    const today = '2026-09-29'

    expect(expandWatch(pozOctober, { today, limit: 0 }).queries).toEqual([])
    expect(() => expandWatch(pozOctober, { today, limit: -1 })).toThrow(/limit/)
    expect(() => expandWatch(pozOctober, { today, limit: 2.5 })).toThrow(/limit/)
    expect(() => expandWatch(pozOctober, { today, limit: 5, scanIndex: -1 })).toThrow(/scanIndex/)
  })
})
