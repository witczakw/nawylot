import type { Money } from './money'

function fractionDigits(currency: string): number {
  return (
    new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 2
  )
}

// Kwoty w komunikatach w pełnych jednostkach, z odstępem tysięcy: „1 186 zł”.
export function formatMoney(amount: Money): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: amount.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: 'always',
  }).format(amount.amountMinor / 10 ** fractionDigits(amount.currency))
}

// „16–18.10”, a gdy miesiące się różnią — „30.10–2.11”.
export function formatTripDates(outboundDate: string, returnDate: string): string {
  const [outYear, outMonth, outDay] = outboundDate.split('-')
  const [retYear, retMonth, retDay] = returnDate.split('-')
  const day = (d: string | undefined) => String(Number(d))
  if (outYear !== retYear) {
    return `${day(outDay)}.${outMonth}.${outYear}–${day(retDay)}.${retMonth}.${retYear}`
  }
  if (outMonth !== retMonth) return `${day(outDay)}.${outMonth}–${day(retDay)}.${retMonth}`
  return `${day(outDay)}–${day(retDay)}.${retMonth}`
}

// Moment pobrania ceny w strefie użytkownika: „29.09, 21:40”.
export function formatFetchedAt(fetchedAt: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('pl-PL', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(fetchedAt)
}

// 1 noc, 2 noce, 5 nocy, 22 noce.
export function nightsLabel(nights: number): string {
  if (nights === 1) return '1 noc'
  const lastDigit = nights % 10
  const lastTwo = nights % 100
  const few = lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)
  return `${nights} ${few ? 'noce' : 'nocy'}`
}
