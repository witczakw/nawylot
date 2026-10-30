import type { ReactNode } from 'react'
import { Tag } from '../components/Choice'
import { Composer } from '../components/Composer'
import { DealCard } from '../components/DealCard'
import { Icon, type IconName } from '../components/Icon'
import { deals } from '../data/mock'
import { zl } from '../lib/format'

const steps: Array<{ icon: IconName; title: string; text: string }> = [
  {
    icon: 'message',
    title: 'Opisujesz wyjazd',
    text: 'Dokąd, kiedy, skąd i za ile. Zwyczajnie, jak znajomemu. Szczegóły poprawisz jednym kliknięciem.',
  },
  {
    icon: 'clock',
    title: 'Pilnujemy cen',
    text: 'Co kilka godzin, także w nocy, sprawdzamy loty i noclegi na wszystkie pasujące terminy.',
  },
  {
    icon: 'bell',
    title: 'Dostajesz alert',
    text: 'Tylko gdy cały wyjazd mieści się w budżecie. Kupujesz sam, u partnera, bez pośrednika.',
  },
]

const promises: Array<{ icon: IconName; text: string }> = [
  {
    icon: 'credit-card',
    text: 'Nie pobieramy pieniędzy za wyjazd. Lot i nocleg opłacasz u partnerów.',
  },
  { icon: 'clock', text: 'Każda cena z godziną sprawdzenia, bo ceny lotów zmieniają się szybko.' },
  { icon: 'mail', text: 'Najwyżej jeden alert dziennie na wyjazd. Bez newslettera.' },
]

function Wide({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-wide px-4 md:px-6 ${className ?? ''}`}>{children}</div>
  )
}

export function Landing() {
  const deal = deals.teneryfa!
  return (
    <>
      <Wide className="grid items-start gap-10 py-10 md:py-16 lg:grid-cols-12 lg:gap-12 lg:py-20">
        <div className="flex flex-col gap-8 lg:col-span-7">
          <div className="flex flex-col gap-4">
            <h1 className="text-balance text-h1 md:text-display">
              Ty ustalasz budżet. My pilnujemy cen.
            </h1>
            <p className="max-w-content text-body text-text-muted">
              Napisz, jaki wyjazd planujesz. Pilnujemy cen lotów i noclegów i piszemy, gdy całość
              zmieści się w budżecie.
            </p>
          </div>
          <Composer />
        </div>

        <aside className="flex flex-col gap-3 lg:col-span-5 lg:pt-4" aria-labelledby="przyklad">
          <p id="przyklad" className="text-label text-text-muted">
            Tak wygląda okazja, o której napiszemy
          </p>
          <DealCard deal={deal} compact />
          <p className="text-small text-text-muted">
            Przykład z tego tygodnia dla budżetu {zl(deal.budget)} na osobę.
          </p>
        </aside>
      </Wide>

      <section className="border-y border-border bg-surface-2" aria-labelledby="jak">
        <Wide className="flex flex-col gap-10 py-16">
          <h2 id="jak" className="text-h1">
            Jak to działa
          </h2>
          <ol className="grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <li key={s.title} className="flex flex-col gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-control border border-border bg-surface text-text">
                  <Icon name={s.icon} size={20} />
                </span>
                <h3 className="text-body font-semibold">{s.title}</h3>
                <p className="text-ui text-text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </Wide>
      </section>

      <Wide className="grid items-center gap-10 py-16 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-4">
          <h2 className="text-balance text-h1">Liczymy cały koszt, nie samą cenę biletu</h2>
          <p className="text-body text-text-muted">
            Tani lot z drogim bagażem i noclegiem daleko od plaży to nie okazja. Do budżetu wliczamy
            wszystko, co faktycznie zapłacisz, i porównujemy to z ceną, jaką widzieliśmy wcześniej.
          </p>
        </div>
        <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-ui font-semibold">
              {deal.place}, {deal.shortDates}
            </p>
            <p className="text-small text-text-muted">na osobę</p>
          </div>
          <dl className="flex flex-col text-ui">
            {deal.breakdown.map((l) => (
              <div key={l.label} className="flex justify-between gap-4 border-b border-border py-3">
                <dt className="text-text-muted">{l.label}</dt>
                <dd className="nums">{zl(l.amount)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 pt-3 font-semibold">
              <dt>Razem</dt>
              <dd className="nums">{zl(deal.perPerson)}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Tag tone="sun" icon="trending-down">
              o {zl(deal.budget - deal.perPerson)} poniżej budżetu
            </Tag>
            <span className="text-small text-text-muted">Cena z {deal.checkedAt}</span>
          </div>
        </div>
      </Wide>

      <Wide className="pb-16">
        <ul className="grid gap-6 border-t border-border pt-10 md:grid-cols-3">
          {promises.map((p) => (
            <li key={p.text} className="flex items-start gap-3 text-ui">
              <Icon name={p.icon} size={20} className="text-text-muted" />
              {p.text}
            </li>
          ))}
        </ul>
      </Wide>
    </>
  )
}
