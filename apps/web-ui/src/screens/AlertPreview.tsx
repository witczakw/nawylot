import { Card, Page, PageHead } from '../components/Layout'
import { deals, user } from '../data/mock'
import { zl } from '../lib/format'

export function AlertPreview() {
  const d = deals.teneryfa!
  const below = d.budget - d.perPerson
  const headline = `Teneryfa, ${d.shortDates}: ${zl(d.perPerson)}/os. (${zl(below)} poniżej budżetu)`
  const link = 'nawylot.pl/o/tfs-1302'

  return (
    <Page>
      <PageHead
        title="Podgląd alertu"
        lead="Tak wygląda wiadomość, gdy znajdziemy wyjazd w budżecie. W obu kanałach ta sama treść: krótko i z jednym linkiem."
      />

      <div className="grid items-start gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-3" aria-labelledby="email">
          <h2 id="email" className="text-h2">
            E-mail
          </h2>
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-1 border-b border-border bg-surface-2 px-6 py-4 text-small">
              <p>
                <span className="text-text-muted">Od: </span>Nawylot, alerty@nawylot.pl
              </p>
              <p>
                <span className="text-text-muted">Do: </span>
                {user.email}
              </p>
              <p className="font-semibold">
                <span className="font-normal text-text-muted">Temat: </span>
                {headline}
              </p>
            </div>
            <div className="flex flex-col gap-4 p-6 text-body">
              <p>Cześć {user.name},</p>
              <p>znaleźliśmy wyjazd, który mieści się w Twoim budżecie {zl(d.budget)} na osobę.</p>
              <div className="flex flex-col gap-1 rounded-control bg-surface-2 p-4 text-ui">
                <p className="font-semibold">
                  {d.place}, {d.region}
                </p>
                <p className="nums">
                  {d.from} do {d.to}, {d.dates}, 7 nocy
                </p>
                <p className="nums">
                  {zl(d.perPerson)} na osobę: lot {zl(1020)}, bagaż {zl(180)}, nocleg {zl(860)},
                  transfer około {zl(100)}
                </p>
              </div>
              <p className="text-small text-text-muted">
                Cena z {d.checkedAt}. Może się zmienić, zanim zarezerwujesz.
              </p>
              <div>
                <span className="inline-flex h-12 items-center rounded-control bg-accent px-6 text-body font-semibold text-accent-fg">
                  Zobacz ofertę
                </span>
              </div>
              <p className="border-t border-border pt-4 text-small text-text-muted">
                Pilnujesz wyjazdu „Ciepło, 7 nocy, luty”. Alerty możesz wyłączyć w ustawieniach.
              </p>
            </div>
          </Card>
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="wa">
          <h2 id="wa" className="text-h2">
            WhatsApp
          </h2>
          <div className="flex flex-col gap-2 rounded-card bg-surface-2 p-4">
            <p className="text-label text-text-muted">Nawylot</p>
            <div className="flex max-w-[85%] flex-col gap-2 rounded-card rounded-tl-tag border border-border bg-surface p-4 text-ui">
              <p className="font-semibold">{headline}</p>
              <p>Lot z Berlina bez przesiadek, apartament na 7 nocy, bagaż i transfer w cenie.</p>
              <p className="text-text-muted">Cena z {d.checkedAt}, może się zmienić.</p>
              <p className="text-accent-text underline underline-offset-4">{link}</p>
              <p className="nums self-end text-label text-text-muted">14:21</p>
            </div>
          </div>
        </section>
      </div>
    </Page>
  )
}
