// Kwoty zawsze jako liczba całkowita jednostek minor (grosze, centy) + kod waluty ISO 4217.
export interface Money {
  readonly amountMinor: number
  readonly currency: string
}

export function money(amountMinor: number, currency: string): Money {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new RangeError(`Kwota musi być liczbą całkowitą jednostek minor, jest: ${amountMinor}`)
  }
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new RangeError(`Kod waluty musi mieć 3 wielkie litery (ISO 4217), jest: ${currency}`)
  }
  return { amountMinor, currency }
}

export function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`Nie można łączyć kwot w różnych walutach: ${a.currency} i ${b.currency}`)
  }
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b)
  return money(a.amountMinor + b.amountMinor, a.currency)
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b)
  return money(a.amountMinor - b.amountMinor, a.currency)
}

// Mnożnik całkowity (liczba osób, liczba nocy), więc wynik zostaje w pełnych groszach.
export function multiply(amount: Money, times: number): Money {
  if (!Number.isSafeInteger(times)) {
    throw new RangeError(`Mnożnik musi być liczbą całkowitą, jest: ${times}`)
  }
  return money(amount.amountMinor * times, amount.currency)
}

export function compare(a: Money, b: Money): -1 | 0 | 1 {
  assertSameCurrency(a, b)
  return a.amountMinor < b.amountMinor ? -1 : a.amountMinor > b.amountMinor ? 1 : 0
}
