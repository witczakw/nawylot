import { compare, multiply, type Money } from './money'

// Najniższy score, przy którym wysyłamy alert. 0 = cena nie wyższa niż zwykle na tej trasie;
// nowa trasa bez historii ma score 0, więc też dostaje alert, jeśli mieści się w budżecie.
export const MIN_DEAL_SCORE = 0
// Ile alertów na kanał może dostać jeden użytkownik w ciągu 24 h.
export const MAX_ALERTS_PER_USER_PER_DAY = 3
// O ile procent musi spaść cena tego samego wyjazdu, żeby wysłać alert ponownie.
export const SIGNIFICANT_DROP_PERCENT = 5

export interface DealCheck {
  total: Money
  pax: number
  budgetPerPerson: Money
  score: number
}

export function isDeal({ total, pax, budgetPerPerson, score }: DealCheck): boolean {
  return compare(total, multiply(budgetPerPerson, pax)) <= 0 && score >= MIN_DEAL_SCORE
}

export interface Trip {
  origin: string
  destination: string
  outboundDate: string
  returnDate: string
}

// Ten sam wyjazd = ta sama trasa i te same daty, niezależnie od godzin lotu i hotelu.
export function offerFingerprint(trip: Trip): string {
  return `${trip.origin}-${trip.destination}|${trip.outboundDate}|${trip.returnDate}`
}

function minutesOfDay(time: string): number {
  const match = /^(\d{2}):(\d{2})/.exec(time)
  if (!match) throw new RangeError(`Niepoprawna godzina (oczekiwane HH:MM): ${time}`)
  return Number(match[1]) * 60 + Number(match[2])
}

function localMinutes(now: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const part = (type: 'hour' | 'minute') => Number(parts.find((p) => p.type === type)?.value)
  return part('hour') * 60 + part('minute')
}

// Ile minut zostało do końca quiet hours (0, gdy teraz ich nie ma). Godziny w strefie
// użytkownika; przedział może przechodzić przez północ (22:00–07:00).
export function quietHoursRemaining(
  now: Date,
  timeZone: string,
  from: string | null,
  to: string | null,
): number {
  if (from === null || to === null) return 0
  const start = minutesOfDay(from)
  const end = minutesOfDay(to)
  if (start === end) return 0
  const current = localMinutes(now, timeZone)
  const inside = start < end ? current >= start && current < end : current >= start || current < end
  return inside ? (end - current + 24 * 60) % (24 * 60) : 0
}

export interface DeliveryInput {
  now: Date
  timeZone: string
  quietHoursFrom: string | null
  quietHoursTo: string | null
  // Ile alertów ten użytkownik dostał tym kanałem w ostatnich 24 h.
  alertsSentLast24h: number
  // Kwota z ostatniego alertu o tym samym wyjeździe (offerFingerprint) tym kanałem.
  previouslyAlerted: Money | null
  total: Money
}

export type DeliveryDecision =
  | { action: 'send' }
  | { action: 'defer'; minutes: number }
  | { action: 'skip'; reason: 'duplicate' | 'daily-limit' }

export function decideDelivery(input: DeliveryInput): DeliveryDecision {
  if (input.previouslyAlerted !== null) {
    const threshold = multiply(input.previouslyAlerted, 100 - SIGNIFICANT_DROP_PERCENT)
    if (compare(multiply(input.total, 100), threshold) > 0) {
      return { action: 'skip', reason: 'duplicate' }
    }
  }
  if (input.alertsSentLast24h >= MAX_ALERTS_PER_USER_PER_DAY) {
    return { action: 'skip', reason: 'daily-limit' }
  }
  const quietMinutes = quietHoursRemaining(
    input.now,
    input.timeZone,
    input.quietHoursFrom,
    input.quietHoursTo,
  )
  if (quietMinutes > 0) return { action: 'defer', minutes: quietMinutes }
  return { action: 'send' }
}
