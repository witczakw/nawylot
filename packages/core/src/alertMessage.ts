import type { Money } from './money'

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
