import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Skeleton, Sparkline, StatusTag } from '../components/Bits'
import { Button } from '../components/Button'
import { Icon } from '../components/Icon'
import { Card, Page, PageHead, StickyAction } from '../components/Layout'
import { Dialog, LayerActions, Sheet } from '../components/Overlay'
import { useToast } from '../components/Toast'
import { deals, lastCheck, type Watch } from '../data/mock'
import { plural, zl } from '../lib/format'
import { emptyPlan } from '../lib/plan'
import { useApp } from '../state/app'

export function Watches() {
  const { watches, setWatches, setPlan } = useApp()
  const [params] = useSearchParams()
  const forced = params.get('stan')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<Watch | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (forced === 'ladowanie') return
    const t = window.setTimeout(() => setLoading(false), 600)
    return () => window.clearTimeout(t)
  }, [forced])

  const list = forced === 'pusto' ? [] : watches
  const active = list.filter((w) => w.status !== 'paused').length
  const dealId = list.find((w) => w.status === 'deal')?.dealId
  const best = dealId ? deals[dealId] : undefined
  const addNew = () => {
    setPlan(emptyPlan)
    navigate('/')
  }

  if (loading || forced === 'ladowanie') return <WatchesSkeleton />

  if (!list.length) {
    return (
      <Page>
        <PageHead title="Twoje wyjazdy" />
        <div className="flex flex-col items-start gap-4 py-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-card bg-surface-2 text-text-muted">
            <Icon name="bell" size={20} />
          </span>
          <p className="text-body">
            Ustaw pierwszy wyjazd: napisz, dokąd chcesz jechać i ile chcesz wydać, a zaczniemy
            pilnować cen.
          </p>
          <Button size="lg" onClick={addNew}>
            Ustaw pierwszy wyjazd
          </Button>
        </div>
      </Page>
    )
  }

  return (
    <Page sticky>
      <PageHead title="Twoje wyjazdy">
        <p className="order-last flex items-center gap-2 text-ui text-text-muted" role="status">
          <Icon name="clock" />
          {active === 0
            ? `Wszystko wstrzymane, ostatnie sprawdzenie ${lastCheck}`
            : `Pilnujemy ${active === 1 ? 'jednego wyjazdu' : `${active} ${plural(active, ['wyjazdu', 'wyjazdów', 'wyjazdów'])}`}, ostatnie sprawdzenie ${lastCheck}`}
        </p>
      </PageHead>

      <div className="grid items-start gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-3 lg:col-span-8">
          <Card className="overflow-hidden">
            <ul className="divide-y divide-border">
              {list.map((w) => (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() =>
                      w.status === 'deal' && w.dealId ? navigate(`/okazja/${w.dealId}`) : setOpen(w)
                    }
                    className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-hover focus-visible:shadow-focus md:grid md:grid-cols-[minmax(0,1fr)_128px_80px_128px_16px] md:px-5 md:py-4"
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-ui font-semibold">{w.title}</span>
                      <span className="truncate text-small text-text-muted">{w.meta}</span>
                    </span>
                    {w.prices.length > 1 ? (
                      <>
                        <Sparkline
                          prices={w.prices}
                          budget={w.budget}
                          className="hidden min-[400px]:block md:hidden"
                        />
                        <Sparkline
                          prices={w.prices}
                          budget={w.budget}
                          width={128}
                          className="hidden md:block"
                        />
                      </>
                    ) : (
                      <span className="hidden md:block" />
                    )}
                    <span className="flex shrink-0 flex-col items-end gap-1 md:contents">
                      <span className="nums text-ui font-semibold md:text-right">
                        {w.prices.length ? zl(w.prices[w.prices.length - 1]!) : 'Sprawdzamy'}
                      </span>
                      <span className="md:flex md:justify-end">
                        <StatusTag status={w.status} />
                      </span>
                    </span>
                    <Icon name="chevron-right" className="hidden text-text-muted md:block" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          <p className="text-small text-text-muted">
            Linia przerywana to Twój budżet. Cena to najniższy znaleziony koszt na osobę.
          </p>
        </div>

        <aside className="flex flex-col gap-4 lg:col-span-4">
          {best && (
            <Card className="flex flex-col gap-3 p-6">
              <p className="text-label text-text-muted">Najlepsza okazja teraz</p>
              <p className="text-ui font-semibold">
                {best.place}, {best.region}
              </p>
              <p className="nums text-h1">{zl(best.perPerson)}</p>
              <p className="text-small text-text-muted">
                na osobę, {best.shortDates}, o {zl(best.budget - best.perPerson)} poniżej budżetu
              </p>
              <Button
                variant="secondary"
                iconRight="chevron-right"
                onClick={() => navigate(`/okazja/${best.id}`)}
              >
                Zobacz okazję
              </Button>
            </Card>
          )}
          <StickyAction>
            <Button size="lg" block icon="plus" onClick={addNew}>
              Dodaj wyjazd
            </Button>
          </StickyAction>
        </aside>
      </div>

      {open && <WatchSheet watch={open} onClose={() => setOpen(null)} setWatches={setWatches} />}
    </Page>
  )
}

function WatchSheet({
  watch,
  onClose,
  setWatches,
}: {
  watch: Watch
  onClose: () => void
  setWatches: ReturnType<typeof useApp>['setWatches']
}) {
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()
  const paused = watch.status === 'paused'
  const best = watch.prices[watch.prices.length - 1]

  const togglePause = () => {
    setWatches((all) =>
      all.map((w) => (w.id === watch.id ? { ...w, status: paused ? 'searching' : 'paused' } : w)),
    )
    toast(
      paused
        ? {
            kind: 'success',
            title: 'Wznowiliśmy pilnowanie',
            description: 'Kolejne sprawdzenie cen w ciągu godziny.',
          }
        : {
            kind: 'success',
            title: 'Wstrzymaliśmy pilnowanie',
            description: 'Nie sprawdzamy cen, dopóki nie wznowisz. Historia zostaje.',
          },
    )
    onClose()
  }

  const remove = () => {
    setDeleting(true)
    window.setTimeout(() => {
      let index = 0
      setWatches((all) => {
        index = all.findIndex((w) => w.id === watch.id)
        return all.filter((w) => w.id !== watch.id)
      })
      toast({
        kind: 'success',
        title: 'Usunęliśmy alert',
        description: `Nie sprawdzamy już cen dla „${watch.title}”.`,
        action: {
          label: 'Cofnij',
          onClick: () =>
            setWatches((all) => {
              const next = [...all]
              next.splice(index, 0, watch)
              return next
            }),
        },
      })
      onClose()
    }, 800)
  }

  return (
    <>
      <Sheet
        open={!confirm}
        onClose={onClose}
        title={watch.title}
        description={watch.meta}
        footer={
          <>
            <Button
              variant="danger-ghost"
              icon="trash"
              onClick={() => setConfirm(true)}
              className="mr-auto"
            >
              Usuń alert
            </Button>
            <Button variant="secondary" icon={paused ? 'play' : 'pause'} onClick={togglePause}>
              {paused ? 'Wznów pilnowanie' : 'Wstrzymaj pilnowanie'}
            </Button>
          </>
        }
      >
        <div className="flex items-center justify-between gap-4 rounded-control bg-surface-2 p-4">
          <div className="flex flex-col gap-1">
            <StatusTag status={watch.status} />
            {best ? (
              <p className="text-ui">
                Najniższa cena <span className="nums font-semibold">{zl(best)}</span> na osobę,
                budżet {zl(watch.budget)}.
              </p>
            ) : (
              <p className="text-ui">Pierwsze ceny sprawdzimy w ciągu godziny.</p>
            )}
          </div>
          {watch.prices.length > 1 && (
            <Sparkline prices={watch.prices} budget={watch.budget} width={96} height={40} />
          )}
        </div>
        {best && best > watch.budget && (
          <p className="text-small text-text-muted">
            Brakuje {zl(best - watch.budget)} do budżetu. Napiszemy, gdy cena spadnie albo gdy
            znajdziemy tańszy nocleg.
          </p>
        )}
      </Sheet>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        locked={deleting}
        role="alertdialog"
        title="Usunąć alert?"
        description={`Przestaniemy sprawdzać ceny dla „${watch.title}” i usuniemy historię cen z ${watch.historyDays} dni.`}
        footer={
          <LayerActions
            onCancel={() => setConfirm(false)}
            confirm="Usuń alert"
            danger
            saving={deleting}
            onConfirm={remove}
          />
        }
      />
    </>
  )
}

function WatchesSkeleton() {
  return (
    <Page>
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Wczytujemy wyjazdy">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-5 w-3/4" />
      </div>
      <Card className="divide-y divide-border">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <Skeleton className="hidden h-8 w-20 min-[400px]:block" />
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        ))}
      </Card>
    </Page>
  )
}
