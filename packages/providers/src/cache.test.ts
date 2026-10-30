import { money } from '@nawylot/core'
import { describe, expect, it } from 'vitest'
import { PROVIDER_CACHE_TTL_MS, TtlCache, cachedFlightProvider, cachedStayProvider } from './cache'
import type {
  FlightOffer,
  FlightProvider,
  FlightSearch,
  StayOffer,
  StayProvider,
  StaySearch,
} from './types'

const pozBcn: FlightSearch = {
  origin: 'POZ',
  destination: 'BCN',
  outboundDate: '2026-10-17',
  returnDate: '2026-10-19',
  adults: 1,
  currency: 'PLN',
}

function flightOffer(fetchedAt: Date): FlightOffer {
  return {
    provider: 'test-flights',
    origin: 'POZ',
    destination: 'BCN',
    outboundDate: '2026-10-17',
    returnDate: '2026-10-19',
    outbound: {
      from: 'POZ',
      to: 'BCN',
      departsAt: '2026-10-17T06:05',
      arrivesAt: '2026-10-17T09:00',
      stops: 0,
      carriers: ['Test Air'],
    },
    inbound: null,
    pricePerPerson: money(41_200, 'PLN'),
    deepLink: 'https://example.com/lot',
    fetchedAt,
  }
}

function setup() {
  let now = Date.parse('2026-09-29T19:40:00Z')
  const clock = {
    now: () => now,
    advance: (ms: number) => {
      now += ms
    },
  }
  const calls: FlightSearch[] = []
  const provider: FlightProvider = {
    id: 'test-flights',
    searchFlights: async (search) => {
      calls.push(search)
      return [flightOffer(new Date(clock.now()))]
    },
  }
  const cached = cachedFlightProvider(provider, new TtlCache(PROVIDER_CACHE_TTL_MS, clock.now))
  return { clock, calls, cached }
}

describe('cachedFlightProvider', () => {
  it('drugie takie samo zapytanie w ciągu 6 h nie idzie do providera i ma pierwotną datę pobrania', async () => {
    const { clock, calls, cached } = setup()

    const first = await cached.searchFlights(pozBcn)
    clock.advance(PROVIDER_CACHE_TTL_MS - 1)
    const second = await cached.searchFlights({ ...pozBcn })

    expect(calls).toHaveLength(1)
    expect(second[0]?.fetchedAt).toEqual(first[0]?.fetchedAt)
  })

  it('po 6 h pyta providera ponownie', async () => {
    const { clock, calls, cached } = setup()

    await cached.searchFlights(pozBcn)
    clock.advance(PROVIDER_CACHE_TTL_MS)
    await cached.searchFlights(pozBcn)

    expect(calls).toHaveLength(2)
  })

  it('inna data, liczba osób, waluta albo cel to osobne wpisy', async () => {
    const { calls, cached } = setup()

    await cached.searchFlights(pozBcn)
    await cached.searchFlights({ ...pozBcn, returnDate: '2026-10-20' })
    await cached.searchFlights({ ...pozBcn, adults: 2 })
    await cached.searchFlights({ ...pozBcn, currency: 'EUR' })
    await cached.searchFlights({ ...pozBcn, destination: null })

    expect(calls).toHaveLength(5)
  })

  it('równoległe zapytania o to samo wywołują providera raz', async () => {
    const { calls, cached } = setup()

    await Promise.all([cached.searchFlights(pozBcn), cached.searchFlights(pozBcn)])

    expect(calls).toHaveLength(1)
  })

  it('nie zapamiętuje błędu — kolejne zapytanie próbuje ponownie', async () => {
    let attempt = 0
    const flaky: FlightProvider = {
      id: 'flaky',
      searchFlights: async () => {
        attempt++
        if (attempt === 1) throw new Error('HTTP 503')
        return []
      },
    }
    const cached = cachedFlightProvider(flaky)

    await expect(cached.searchFlights(pozBcn)).rejects.toThrow('HTTP 503')
    await expect(cached.searchFlights(pozBcn)).resolves.toEqual([])
    expect(attempt).toBe(2)
  })
})

describe('TtlCache', () => {
  it('usuwa przeterminowane wpisy przy dodawaniu nowych', async () => {
    let now = 0
    const cache = new TtlCache<number>(1000, () => now)

    await cache.getOrLoad('a', async () => 1)
    await cache.getOrLoad('b', async () => 2)
    now = 1000
    await cache.getOrLoad('c', async () => 3)

    expect(cache.size).toBe(1)
  })
})

describe('cachedStayProvider', () => {
  const barcelona: StaySearch = {
    destination: 'BCN',
    checkIn: '2026-10-17',
    checkOut: '2026-10-19',
    adults: 1,
    currency: 'PLN',
  }
  const stay: StayOffer = {
    provider: 'test-stays',
    name: 'Hostel Test',
    checkIn: '2026-10-17',
    checkOut: '2026-10-19',
    pricePerNight: money(38_700, 'PLN'),
    deepLink: 'https://example.com/nocleg',
    fetchedAt: new Date('2026-09-29T19:40:00Z'),
  }

  it('zapamiętuje noclegi per cel, daty, osoby i walutę', async () => {
    const calls: StaySearch[] = []
    const provider: StayProvider = {
      id: 'test-stays',
      searchStays: async (search) => {
        calls.push(search)
        return [stay]
      },
    }
    const cached = cachedStayProvider(provider)

    await cached.searchStays(barcelona)
    await cached.searchStays({ ...barcelona })
    await cached.searchStays({ ...barcelona, checkOut: '2026-10-20' })

    expect(calls).toHaveLength(2)
  })
})
