import { add, money, multiply, type Money } from './money'

// Szacunek dopłaty za bagaż na osobę w jednostkach minor waluty watcha. 0 = lecimy z tym,
// co jest w cenie biletu (bagaż podręczny) — typowe przy wyjazdach na 2–5 dni.
export const BAGGAGE_ESTIMATE_PER_PERSON_MINOR = 0

export interface TotalCostInput {
  // Cena lotu w obie strony dla jednej osoby.
  flightPerPerson: Money
  pax: number
  // Cena noclegu za jedną noc dla całej grupy.
  stayPerNight: Money
  nights: number
  // Szacowana dopłata za bagaż w obie strony dla jednej osoby.
  baggagePerPerson: Money
}

export interface TotalCost {
  flight: Money
  stay: Money
  baggage: Money
  total: Money
  // Zaokrąglone w górę do pełnego grosza — nie zaniżamy kosztu na osobę.
  perPerson: Money
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${name} musi być dodatnią liczbą całkowitą, jest: ${value}`)
  }
}

export function totalCost(input: TotalCostInput): TotalCost {
  assertPositiveInteger(input.pax, 'pax')
  assertPositiveInteger(input.nights, 'nights')

  const flight = multiply(input.flightPerPerson, input.pax)
  const stay = multiply(input.stayPerNight, input.nights)
  const baggage = multiply(input.baggagePerPerson, input.pax)
  const total = add(add(flight, stay), baggage)
  const perPerson = money(Math.ceil(total.amountMinor / input.pax), total.currency)

  return { flight, stay, baggage, total, perPerson }
}
