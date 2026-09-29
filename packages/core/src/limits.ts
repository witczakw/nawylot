// Główny koszt zmienny to zapytania do providerów cen (docs/BILLING.md), więc każdy watch
// ma dobowy budżet zapytań. Wartości do przeliczenia wzorem z BILLING.md przed startem.
const MINUTES_PER_DAY = 24 * 60

export const DAILY_QUERY_BUDGET_PER_WATCH = 24

// Top-N: dla ilu najtańszych lotów w skanie szukamy noclegu.
export const MAX_STAY_QUERIES_PER_SCAN = 3

// Plan „Na próbę”: skan co 24 h. Pozostałe plany przyjdą z entitlements (M4.5).
export const DEFAULT_SCAN_INTERVAL_MINUTES = MINUTES_PER_DAY

export interface ScanBudget {
  flightQueries: number
  stayQueries: number
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${name} musi być dodatnią liczbą całkowitą, jest: ${value}`)
  }
}

export function scanBudget(
  scanIntervalMinutes: number,
  dailyBudget: number = DAILY_QUERY_BUDGET_PER_WATCH,
): ScanBudget {
  assertPositiveInteger(scanIntervalMinutes, 'scanIntervalMinutes')
  assertPositiveInteger(dailyBudget, 'dailyBudget')

  const scansPerDay = Math.ceil(MINUTES_PER_DAY / scanIntervalMinutes)
  const perScan = Math.floor(dailyBudget / scansPerDay)
  if (perScan < 2) {
    throw new RangeError(
      `Budżet ${dailyBudget} zapytań/dobę nie starcza na skan co ${scanIntervalMinutes} min ` +
        '(potrzeba co najmniej 1 zapytania o loty i 1 o nocleg na skan).',
    )
  }

  const stayQueries = Math.min(MAX_STAY_QUERIES_PER_SCAN, Math.floor(perScan / 2))
  return { flightQueries: perScan - stayQueries, stayQueries }
}

export function isScanDue(
  lastScannedAt: Date | null,
  now: Date,
  scanIntervalMinutes: number,
): boolean {
  if (lastScannedAt === null) return true
  return now.getTime() - lastScannedAt.getTime() >= scanIntervalMinutes * 60_000
}

// Kolejne okna czasu dają kolejne numery skanu — `expandWatch` przesuwa nimi listę zapytań.
export function scanIndex(now: Date, scanIntervalMinutes: number): number {
  assertPositiveInteger(scanIntervalMinutes, 'scanIntervalMinutes')
  return Math.floor(now.getTime() / (scanIntervalMinutes * 60_000))
}
