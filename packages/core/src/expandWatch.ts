import { addDays, daysBetween } from './dates'

export interface WatchSearch {
  origins: readonly string[]
  // null = „dowolnie”
  destinations: readonly string[] | null
  dateFrom: string
  dateTo: string
  nightsMin: number
  nightsMax: number
}

export interface FlightQuery {
  origin: string
  destination: string | null
  outboundDate: string
  returnDate: string
  nights: number
}

export interface ExpandOptions {
  // Najwcześniejsza dopuszczalna data wylotu.
  today: string
  // Maksymalna liczba zapytań w tym skanie (budżet z limits.ts).
  limit: number
  // Numer skanu; kolejne skany biorą kolejne okna listy, żeby pokryć całe okno dat.
  scanIndex?: number
}

export interface ExpandedWatch {
  queries: FlightQuery[]
  // Liczba wszystkich kombinacji przed nałożeniem limitu.
  total: number
}

function allQueries(watch: WatchSearch, today: string): FlightQuery[] {
  const firstOutbound = daysBetween(today, watch.dateFrom) >= 0 ? watch.dateFrom : today
  const destinations = watch.destinations ?? [null]
  const queries: FlightQuery[] = []

  for (
    let outboundDate = firstOutbound;
    daysBetween(outboundDate, watch.dateTo) >= watch.nightsMin;
    outboundDate = addDays(outboundDate, 1)
  ) {
    for (let nights = watch.nightsMin; nights <= watch.nightsMax; nights++) {
      const returnDate = addDays(outboundDate, nights)
      if (daysBetween(returnDate, watch.dateTo) < 0) break
      for (const origin of watch.origins) {
        for (const destination of destinations) {
          queries.push({ origin, destination, outboundDate, returnDate, nights })
        }
      }
    }
  }
  return queries
}

export function expandWatch(watch: WatchSearch, options: ExpandOptions): ExpandedWatch {
  const { today, limit, scanIndex = 0 } = options
  for (const [name, value] of [
    ['limit', limit],
    ['scanIndex', scanIndex],
  ] as const) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError(`${name} musi być nieujemną liczbą całkowitą, jest: ${value}`)
    }
  }

  const all = allQueries(watch, today)
  if (limit >= all.length) return { queries: all, total: all.length }

  const start = (scanIndex * limit) % all.length
  const rotated = [...all.slice(start), ...all.slice(0, start)]
  return { queries: rotated.slice(0, limit), total: all.length }
}
