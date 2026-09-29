import { formatFetchedAt, formatMoney, formatTripDates, nightsLabel } from './format'
import { add, money, multiply, subtract, type Money } from './money'
import type { TotalCost } from './totalCost'

export interface AlertMessage {
  offerId: string
  // Pierwsze słowa to trasa i cena (docs/ANTI_SLOP.md); tytuł mieści się w powiadomieniu push.
  title: string
  body: string
  // Lot i nocleg zawsze jako dwa osobne linki do dwóch dostawców (CLAUDE.md, zasada 2).
  links: { flight: string; stay: string }
  perPerson: Money
  // Kiedy pobraliśmy cenę — alert zawsze ją pokazuje (CLAUDE.md, zasada 3).
  fetchedAt: Date
}

export interface AlertInput {
  offerId: string
  origin: string
  destination: string
  outboundDate: string
  returnDate: string
  pax: number
  nights: number
  cost: TotalCost
  budgetPerPerson: Money
  fetchedAt: Date
  timeZone: string
  links: { flight: string; stay: string }
}

function budgetNote(cost: TotalCost, budgetPerPerson: Money, pax: number): string {
  const spare = subtract(multiply(budgetPerPerson, pax), cost.total)
  // Zapas na osobę zaokrąglony w dół — nie obiecujemy więcej, niż jest.
  const sparePerPerson = money(Math.floor(spare.amountMinor / pax), spare.currency)
  if (sparePerPerson.amountMinor < 0) {
    return `${formatMoney(money(-sparePerPerson.amountMinor, spare.currency))} ponad budżet`
  }
  const shown = formatMoney(sparePerPerson)
  // Zapas mniejszy niż pełna złotówka nie brzmi dobrze jako „0 zł poniżej budżetu”.
  if (shown === formatMoney(money(0, spare.currency))) return 'mieści się w budżecie'
  return `${shown} poniżej budżetu`
}

function costLine(input: AlertInput): string {
  const { cost, pax, nights } = input
  const parts = [
    `lot ${formatMoney(cost.flight)}`,
    `nocleg ${formatMoney(cost.stay)} (${nightsLabel(nights)})`,
  ]
  if (cost.baggage.amountMinor > 0) parts.push(`bagaż ${formatMoney(cost.baggage)}`)
  const sum = parts.join(' + ')
  if (pax === 1) return sum.charAt(0).toUpperCase() + sum.slice(1)
  return `Za ${pax} os.: ${sum} = ${formatMoney(add(add(cost.flight, cost.stay), cost.baggage))}`
}

// „POZ → BCN, 16–18.10: 1 186 zł/os. (314 zł poniżej budżetu)”
export function buildAlertMessage(input: AlertInput): AlertMessage {
  const route = `${input.origin} → ${input.destination}`
  const dates = formatTripDates(input.outboundDate, input.returnDate)
  const title =
    `${route}, ${dates}: ${formatMoney(input.cost.perPerson)}/os. ` +
    `(${budgetNote(input.cost, input.budgetPerPerson, input.pax)})`
  const body = [
    costLine(input),
    `Cena z ${formatFetchedAt(input.fetchedAt, input.timeZone)} · może się zmienić`,
  ].join('\n')

  return {
    offerId: input.offerId,
    title,
    body,
    links: input.links,
    perPerson: input.cost.perPerson,
    fetchedAt: input.fetchedAt,
  }
}
