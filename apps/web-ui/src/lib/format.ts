const NBSP = ' '

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ')

/** 2160 -> "2 160 zł" (spacja nierozdzielająca, także dla liczb czterocyfrowych). */
export const zl = (amount: number) =>
  `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)}${NBSP}zł`

/** Polska odmiana: plural(5, ["noc", "noce", "nocy"]) -> "nocy". */
export function plural(n: number, [one, few, many]: [string, string, string]) {
  if (n === 1) return one
  const d = n % 10
  const t = n % 100
  if (d >= 2 && d <= 4 && (t < 12 || t > 14)) return few
  return many
}

export const nights = (n: number) => `${n}${NBSP}${plural(n, ['noc', 'noce', 'nocy'])}`
export const people = (n: number) => `${n}${NBSP}${plural(n, ['osoba', 'osoby', 'osób'])}`
