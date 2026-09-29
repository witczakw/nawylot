import type {
  FlightOffer,
  FlightProvider,
  FlightSearch,
  StayOffer,
  StayProvider,
  StaySearch,
} from './types'

export const PROVIDER_CACHE_TTL_MS = 6 * 60 * 60 * 1000

interface Entry<V> {
  expiresAt: number
  value: Promise<V>
}

export class TtlCache<V> {
  private readonly entries = new Map<string, Entry<V>>()

  constructor(
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  get size(): number {
    return this.entries.size
  }

  // Równoległe wywołania z tym samym kluczem czekają na jedno `load`.
  getOrLoad(key: string, load: () => Promise<V>): Promise<V> {
    const now = this.now()
    const hit = this.entries.get(key)
    if (hit && hit.expiresAt > now) return hit.value

    this.removeExpired(now)
    const value = load()
    this.entries.set(key, { expiresAt: now + this.ttlMs, value })
    // Nieudanego zapytania nie trzymamy w cache. Błąd i tak dostaje wywołujący przez `value`.
    value.catch(() => {
      if (this.entries.get(key)?.value === value) this.entries.delete(key)
    })
    return value
  }

  private removeExpired(now: number): void {
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key)
    }
  }
}

function flightKey(providerId: string, s: FlightSearch): string {
  return [
    providerId,
    s.origin,
    s.destination ?? '*',
    s.outboundDate,
    s.returnDate,
    s.adults,
    s.currency,
  ].join('|')
}

function stayKey(providerId: string, s: StaySearch): string {
  return [providerId, s.destination, s.checkIn, s.checkOut, s.adults, s.currency].join('|')
}

export function cachedFlightProvider(
  provider: FlightProvider,
  cache = new TtlCache<FlightOffer[]>(PROVIDER_CACHE_TTL_MS),
): FlightProvider {
  return {
    id: provider.id,
    searchFlights: (search) =>
      cache.getOrLoad(flightKey(provider.id, search), () => provider.searchFlights(search)),
  }
}

export function cachedStayProvider(
  provider: StayProvider,
  cache = new TtlCache<StayOffer[]>(PROVIDER_CACHE_TTL_MS),
): StayProvider {
  return {
    id: provider.id,
    searchStays: (search) =>
      cache.getOrLoad(stayKey(provider.id, search), () => provider.searchStays(search)),
  }
}
