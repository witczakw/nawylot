import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { DealCard, DealRow } from '../components/DealCard'
import { Icon } from '../components/Icon'
import { Card, Page, PageHead, StickyAction } from '../components/Layout'
import { Sheet } from '../components/Overlay'
import { useToast } from '../components/Toast'
import { deals, type Deal as DealT } from '../data/mock'
import { nights, people, zl } from '../lib/format'

export function Deal() {
  const { id = 'teneryfa' } = useParams()
  const deal = deals[id]
  const [open, setOpen] = useState(false)
  const toast = useToast()
  if (!deal) return <Navigate to="/okazja/teneryfa" replace />
  const others = Object.values(deals).filter((d) => d.id !== deal.id)

  return (
    <Page sticky>
      <PageHead
        title={`${deal.region.split(',')[0]} mieści się w budżecie`}
        lead={`${nights(deal.nights)} za ${zl(deal.perPerson)} na osobę. Sprawdziliśmy cenę dziś o ${deal.checkedAt.split(', ')[1]}, może się zmienić.`}
      >
        <Link
          to="/wyjazdy"
          className="mb-2 inline-flex h-8 items-center gap-2 self-start rounded-control px-2 text-ui text-text-muted transition-colors hover:bg-hover hover:text-text focus-visible:shadow-focus"
        >
          <Icon name="arrow-left" />
          Twoje wyjazdy
        </Link>
      </PageHead>

      <div className="grid items-start gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <DealCard deal={deal} />
        </div>

        <aside className="flex flex-col gap-8 lg:col-span-5">
          <Card className="hidden flex-col gap-4 p-6 lg:flex">
            <h2 className="text-h2">Rozbicie ceny</h2>
            <Breakdown deal={deal} />
            <PartnerNote deal={deal} />
            <div className="flex flex-col gap-3">
              <Button size="lg" block iconRight="external-link" onClick={() => out(toast, 'lot')}>
                Przejdź do lotu
              </Button>
              <Button
                variant="secondary"
                block
                iconRight="external-link"
                onClick={() => out(toast, 'nocleg')}
              >
                Przejdź do noclegu
              </Button>
            </div>
          </Card>

          <section className="flex flex-col gap-3" aria-labelledby="inne">
            <h2 id="inne" className="text-h2">
              Inne opcje w budżecie
            </h2>
            <Card className="overflow-hidden">
              <ul className="divide-y divide-border">
                {others.map((d) => (
                  <DealRow key={d.id} deal={d} />
                ))}
              </ul>
            </Card>
          </section>
        </aside>
      </div>

      <div className="lg:hidden">
        <StickyAction>
          <Button size="lg" block className="md:w-auto" onClick={() => setOpen(true)}>
            Zobacz ofertę
          </Button>
        </StickyAction>
      </div>

      {open && <OfferSheet deal={deal} onClose={() => setOpen(false)} />}
    </Page>
  )
}

type Toast = ReturnType<typeof useToast>

const out = (toast: Toast, what: string) =>
  toast({
    kind: 'info',
    title: `Otwieramy stronę partnera: ${what}`,
    description: 'W podglądzie zostajesz w aplikacji.',
  })

function Breakdown({ deal }: { deal: DealT }) {
  return (
    <dl className="flex flex-col text-ui">
      {deal.breakdown.map((l) => (
        <div key={l.label} className="flex justify-between gap-4 border-b border-border py-3">
          <dt className="text-text-muted">{l.label}</dt>
          <dd className="nums">{zl(l.amount)}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-4 py-3 font-semibold">
        <dt>Razem na osobę</dt>
        <dd className="nums">{zl(deal.perPerson)}</dd>
      </div>
      <div className="flex justify-between gap-4 text-text-muted">
        <dt>Razem za {people(deal.people)}</dt>
        <dd className="nums">{zl(deal.perPerson * deal.people)}</dd>
      </div>
    </dl>
  )
}

function PartnerNote({ deal }: { deal: DealT }) {
  return (
    <div className="flex items-start gap-3 rounded-control bg-surface-2 p-4">
      <Icon name="info-circle" className="mt-[3px] text-text-muted" />
      <div className="flex flex-col gap-1">
        <p className="text-ui font-semibold">Przejdziesz do strony partnera</p>
        <p className="text-small text-text-muted">
          Lot i nocleg rezerwujesz osobno, każde u swojego partnera, i płacisz bezpośrednio im. Ceny
          z {deal.checkedAt}, mogą się zmienić.
        </p>
      </div>
    </div>
  )
}

function OfferSheet({ deal, onClose }: { deal: DealT; onClose: () => void }) {
  const toast = useToast()
  return (
    <Sheet
      open
      onClose={onClose}
      title="Rozbicie ceny"
      description={`${deal.place}, ${deal.shortDates}, cena za osobę`}
      footer={
        <>
          <Button
            variant="secondary"
            iconRight="external-link"
            onClick={() => out(toast, 'nocleg')}
            className="w-full md:w-auto"
          >
            Przejdź do noclegu
          </Button>
          <Button
            iconRight="external-link"
            onClick={() => out(toast, 'lot')}
            className="w-full md:w-auto"
          >
            Przejdź do lotu
          </Button>
        </>
      }
    >
      <Breakdown deal={deal} />
      <PartnerNote deal={deal} />
    </Sheet>
  )
}
