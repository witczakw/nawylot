import { assertSameCurrency, type Money } from './money'

export const NEUTRAL_SCORE = 0
// Z jakiego okresu bierzemy historię cen trasy do mediany.
export const HISTORY_WINDOW_DAYS = 90
// Mediana z mniejszej liczby cen jest przypadkowa, więc wtedy nie oceniamy okazji.
export const MIN_HISTORY_SAMPLES = 5

function median(sortedAmounts: readonly number[]): number {
  const mid = Math.floor(sortedAmounts.length / 2)
  const upper = sortedAmounts[mid] ?? 0
  if (sortedAmounts.length % 2 === 1) return upper
  return ((sortedAmounts[mid - 1] ?? 0) + upper) / 2
}

// Score = o ile procent cena jest niższa od mediany historycznych cen tej trasy.
// Dodatni: taniej niż zwykle, ujemny: drożej. Wynik zaokrąglony do pełnego procenta.
export function scoreDeal(price: Money, history: readonly Money[]): number {
  for (const past of history) assertSameCurrency(price, past)
  if (history.length < MIN_HISTORY_SAMPLES) return NEUTRAL_SCORE

  const typical = median(history.map((past) => past.amountMinor).sort((a, b) => a - b))
  if (typical <= 0) return NEUTRAL_SCORE

  return Math.round(((typical - price.amountMinor) / typical) * 100)
}

// Klucz trasy w price_history, np. 'POZ-BCN'. Kierunek ma znaczenie.
export function routeKey(origin: string, destination: string): string {
  return `${origin}-${destination}`
}
