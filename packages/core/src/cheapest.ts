import { compare, type Money } from './money'

export function cheapest<T>(items: readonly T[], price: (item: T) => Money): T | undefined {
  let best: T | undefined
  for (const item of items) {
    if (best === undefined || compare(price(item), price(best)) < 0) best = item
  }
  return best
}

// N najtańszych elementów o różnych kluczach — z każdego klucza zostaje najtańszy.
// Przy równej cenie wygrywa element wcześniejszy na liście.
export function cheapestDistinct<T>(
  items: readonly T[],
  n: number,
  price: (item: T) => Money,
  key: (item: T) => string,
): T[] {
  const bestByKey = new Map<string, T>()
  for (const item of items) {
    const current = bestByKey.get(key(item))
    if (current === undefined || compare(price(item), price(current)) < 0) {
      bestByKey.set(key(item), item)
    }
  }
  return [...bestByKey.values()].sort((a, b) => compare(price(a), price(b))).slice(0, n)
}
