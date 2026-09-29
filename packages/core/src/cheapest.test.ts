import { describe, expect, it } from 'vitest'
import { cheapest, cheapestDistinct } from './cheapest'
import { money } from './money'

interface Flight {
  id: string
  destination: string
  priceZl: number
}

const flight = (id: string, destination: string, priceZl: number): Flight => ({
  id,
  destination,
  priceZl,
})
const price = (f: Flight) => money(f.priceZl * 100, 'PLN')

describe('cheapest', () => {
  it('wybiera najtańszy element', () => {
    const flights = [flight('a', 'BCN', 520), flight('b', 'LIS', 412), flight('c', 'BCN', 610)]

    expect(cheapest(flights, price)?.id).toBe('b')
  })

  it('dla pustej listy zwraca undefined', () => {
    expect(cheapest([], price)).toBeUndefined()
  })
})

describe('cheapestDistinct', () => {
  const flights = [
    flight('bcn-rano', 'BCN', 412),
    flight('bcn-wieczor', 'BCN', 389),
    flight('lis', 'LIS', 455),
    flight('mxp', 'MXP', 301),
    flight('ath', 'ATH', 999),
  ]

  it('bierze N najtańszych celów, każdy tylko raz (najtańszym lotem)', () => {
    const top = cheapestDistinct(flights, 3, price, (f) => f.destination)

    expect(top.map((f) => f.id)).toEqual(['mxp', 'bcn-wieczor', 'lis'])
  })

  it('zwraca mniej, gdy różnych kluczy jest mniej niż N', () => {
    expect(cheapestDistinct(flights.slice(0, 2), 3, price, (f) => f.destination)).toHaveLength(1)
  })

  it('przy remisie cenowym zostawia wcześniejszy element', () => {
    const tied = [flight('pierwszy', 'BCN', 400), flight('drugi', 'BCN', 400)]

    expect(cheapestDistinct(tied, 1, price, (f) => f.destination)[0]?.id).toBe('pierwszy')
  })
})
