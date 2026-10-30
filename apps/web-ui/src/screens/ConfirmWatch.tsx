import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Segmented } from '../components/Choice'
import { Icon } from '../components/Icon'
import { Card, Page, PageHead, StickyAction } from '../components/Layout'
import { PlanChips } from '../components/PlanChips'
import { useToast } from '../components/Toast'
import { user } from '../data/mock'
import { nights, people, zl } from '../lib/format'
import { details, examplePlan, monthLabel, summary } from '../lib/plan'
import { useApp, type Channel } from '../state/app'

export function ConfirmWatch() {
  const { plan, setPlan, channel, setChannel, setWatches } = useApp()
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!plan.budget) setPlan(examplePlan)
  }, [plan.budget, setPlan])

  const save = () => {
    setSaving(true)
    window.setTimeout(() => {
      setWatches((all) => [
        {
          id: `w${Date.now()}`,
          title: [
            plan.idea ?? 'Dowolny kierunek',
            plan.nights ? nights(plan.nights) : null,
            monthLabel(plan.month),
          ]
            .filter(Boolean)
            .join(', '),
          meta: [
            plan.budget ? `do ${zl(plan.budget)}/os.` : null,
            plan.airports.length ? `z ${plan.airports.join(' lub ')}` : null,
            plan.people ? people(plan.people) : null,
          ]
            .filter(Boolean)
            .join(', '),
          budget: plan.budget ?? 0,
          status: 'searching',
          prices: [],
          historyDays: 0,
        },
        ...all,
      ])
      toast({
        kind: 'success',
        title: 'Pilnujemy wyjazdu',
        description:
          'Pierwsze ceny sprawdzimy w ciągu godziny. Napiszemy, gdy coś zmieści się w budżecie.',
      })
      navigate('/wyjazdy')
    }, 900)
  }

  return (
    <Page sticky>
      <PageHead
        title="Sprawdź, czego mamy pilnować"
        lead="Zmień, co trzeba. Potem zaczynamy sprawdzać ceny, także w nocy."
      />

      <div className="grid items-start gap-8 lg:grid-cols-12">
        <Card className="flex flex-col gap-6 p-6 lg:col-span-7">
          <div className="flex flex-col gap-2">
            <p className="text-label text-text-muted">Pilnujemy</p>
            <p className="text-h2">{summary(plan)}</p>
            <p className="text-ui text-text-muted">{details(plan)}</p>
          </div>
          <PlanChips
            plan={plan}
            onChange={(patch) => setPlan((p) => ({ ...p, ...patch }))}
            keys={['idea', 'budget', 'when', 'from', 'people', 'scope']}
            variant="facts"
          />
        </Card>

        <aside className="flex flex-col gap-6 lg:col-span-5">
          <section className="flex flex-col gap-3" aria-labelledby="kanal">
            <h2 id="kanal" className="text-label text-text">
              Gdzie wysyłać alerty
            </h2>
            <Segmented<Channel>
              label="Kanał alertów"
              value={channel}
              onChange={setChannel}
              options={[
                { value: 'email', label: 'E-mail', icon: 'mail' },
                { value: 'whatsapp', label: 'WhatsApp', icon: 'message' },
              ]}
            />
            <p className="text-small text-text-muted">
              {channel === 'email' ? `Na ${user.email}.` : `Na numer ${user.phone}.`} Najwyżej jeden
              alert dziennie dla tego wyjazdu.{' '}
              <Link
                to="/podglad-alertu"
                className="text-accent-text underline underline-offset-4 focus-visible:shadow-focus"
              >
                Zobacz, jak wygląda
              </Link>
            </p>
          </section>

          <ul className="flex flex-col gap-3 border-t border-border pt-6 text-ui">
            <li className="flex items-start gap-3">
              <Icon name="clock" className="mt-[3px] text-text-muted" />
              Pierwsze ceny sprawdzimy w ciągu godziny, potem co kilka godzin.
            </li>
            <li className="flex items-start gap-3">
              <Icon name="bell" className="mt-[3px] text-text-muted" />
              Piszemy tylko wtedy, gdy cały wyjazd mieści się w budżecie.
            </li>
            <li className="flex items-start gap-3">
              <Icon name="pause" className="mt-[3px] text-text-muted" />
              Pilnowanie wstrzymasz albo usuniesz w każdej chwili.
            </li>
          </ul>

          <StickyAction>
            <Button size="lg" block loading={saving} onClick={save}>
              Pilnuj tego wyjazdu
            </Button>
          </StickyAction>
        </aside>
      </div>
    </Page>
  )
}
