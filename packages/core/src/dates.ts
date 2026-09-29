// Daty kalendarzowe jako 'YYYY-MM-DD', bez strefy — tak jak kolumny `date` w Postgresie.
// Arytmetyka w UTC, więc zmiana czasu nie przesuwa dni.
const DAY_MS = 24 * 60 * 60 * 1000

function toEpochDay(date: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const ms = match ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : Number.NaN
  if (Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== date) {
    throw new RangeError(`Niepoprawna data (oczekiwany format YYYY-MM-DD): ${date}`)
  }
  return ms / DAY_MS
}

function fromEpochDay(epochDay: number): string {
  return new Date(epochDay * DAY_MS).toISOString().slice(0, 10)
}

export function addDays(date: string, days: number): string {
  return fromEpochDay(toEpochDay(date) + days)
}

export function daysBetween(from: string, to: string): number {
  return toEpochDay(to) - toEpochDay(from)
}
