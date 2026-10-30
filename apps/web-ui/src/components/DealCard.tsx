import { Link } from 'react-router-dom'
import type { Deal } from '../data/mock'
import { nights, people, zl } from '../lib/format'
import { Tag } from './Choice'
import { Icon, type IconName } from './Icon'

const shortLabel: Partial<Record<IconName, string>> = {
  plane: 'lot',
  luggage: 'bagaż',
  bed: 'nocleg',
  bus: 'transfer',
}

export function DealCard({ deal, compact }: { deal: Deal; compact?: boolean }) {
  const below = deal.budget - deal.perPerson
  return (
    <article className="flex flex-col gap-6 rounded-card border border-border bg-surface p-6">
      <header className="flex flex-col gap-1">
        <p className="text-small text-text-muted">{deal.region}</p>
        <h2 className="text-h2">{deal.place}</h2>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-ui text-text-muted">
          <span className="flex items-center gap-2">
            <Icon name="plane" />
            <span className="nums">
              {deal.from} do {deal.to}
            </span>
          </span>
          <span className="flex items-center gap-2">
            <Icon name="calendar" />
            <span className="nums">
              {compact ? deal.shortDates : deal.dates}, {nights(deal.nights)}
            </span>
          </span>
        </p>
      </header>

      <div className="flex flex-col gap-2">
        <p className={compact ? 'nums text-h1' : 'nums text-display'}>{zl(deal.perPerson)}</p>
        <p className="text-ui text-text-muted">
          za osobę, razem {zl(deal.perPerson * deal.people)} za {people(deal.people)}
        </p>
        <div className="pt-1">
          <Tag tone="sun" icon="trending-down">
            o {zl(below)} poniżej budżetu
          </Tag>
        </div>
      </div>

      {compact ? (
        <p className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-4 text-small text-text-muted">
          {deal.included.map((i) => (
            <span key={i.icon} className="flex items-center gap-1">
              <Icon name={i.icon} />
              {shortLabel[i.icon] ?? i.title}
            </span>
          ))}
        </p>
      ) : (
        <ul className="flex flex-col gap-4 border-t border-border pt-6">
          {deal.included.map((i) => (
            <li key={i.title} className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-surface-2 text-text-muted">
                <Icon name={i.icon} />
              </span>
              <span className="flex flex-col">
                <span className="text-ui font-medium">{i.title}</span>
                <span className="text-small text-text-muted">{i.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="flex items-center gap-2 text-small text-text-muted">
        <Icon name="clock" />
        Cena z {deal.checkedAt}. Może się zmienić.
      </p>
    </article>
  )
}

export function DealRow({ deal }: { deal: Deal }) {
  return (
    <li>
      <Link
        to={`/okazja/${deal.id}`}
        className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-hover focus-visible:shadow-focus"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-ui font-semibold">
            {deal.place}, {deal.region}
          </span>
          <span className="nums text-small text-text-muted">
            {deal.from} do {deal.to}, {deal.shortDates}
          </span>
        </span>
        <span className="flex flex-col items-end">
          <span className="nums text-ui font-semibold">{zl(deal.perPerson)}</span>
          <span className="nums text-small text-text-muted">
            o {zl(deal.budget - deal.perPerson)} mniej
          </span>
        </span>
        <Icon name="chevron-right" className="text-text-muted" />
      </Link>
    </li>
  )
}
