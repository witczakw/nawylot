import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Segmented } from '../components/Choice'
import { Icon } from '../components/Icon'
import { Page, PageHead } from '../components/Layout'
import { useToast } from '../components/Toast'
import { cx } from '../lib/format'

type Period = 'month' | 'year'

const free = ['1 pilnowany wyjazd', 'Sprawdzanie cen co 12 godzin', 'Alerty e-mailem']
const plus = [
  'Do 5 pilnowanych wyjazdów',
  'Sprawdzanie cen co godzinę',
  'Alerty e-mailem i na WhatsApp',
  'Historia cen z 90 dni',
]

function Features({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2 text-ui">
      {items.map((f) => (
        <li key={f} className="flex items-start gap-2">
          <Icon name="check" className="mt-[3px] text-success" />
          {f}
        </li>
      ))}
    </ul>
  )
}

export function Plans() {
  const [period, setPeriod] = useState<Period>('month')
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  const choosePlus = () => {
    setLoading(true)
    // Tu przekierowanie do Stripe Checkout (packages/billing).
    window.setTimeout(() => {
      setLoading(false)
      toast({
        kind: 'info',
        title: 'Tu otworzy się płatność',
        description: 'W podglądzie nic nie zostanie pobrane.',
      })
    }, 800)
  }

  return (
    <Page width="mid">
      <PageHead
        title="Plany"
        lead="Płacisz tylko za pilnowanie cen. Za lot i nocleg płacisz bezpośrednio partnerom."
      />

      <div className="flex flex-col gap-2 md:max-w-dialog">
        <Segmented<Period>
          label="Okres rozliczenia"
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'month', label: 'Miesięcznie' },
            { value: 'year', label: 'Rocznie' },
          ]}
        />
        <p className="text-small text-text-muted">
          {period === 'year'
            ? '190 zł raz w roku, czyli o 38 zł mniej niż 12 miesięcy po 19 zł.'
            : 'Płatność co miesiąc, bez zobowiązań.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section
          className="flex flex-col gap-6 rounded-card border border-border bg-surface p-6"
          aria-labelledby="free"
        >
          <div className="flex flex-col gap-1">
            <h2 id="free" className="text-h2">
              Free
            </h2>
            <p className="nums text-h1">0 zł</p>
            <p className="text-small text-text-muted">bez limitu czasu</p>
          </div>
          <Features items={free} />
          <Button
            variant="secondary"
            block
            className="mt-auto"
            onClick={() => navigate('/wyjazdy')}
          >
            Zostań przy Free
          </Button>
        </section>

        <section
          className={cx(
            'flex flex-col gap-6 rounded-card border border-border-ctl bg-surface-2 p-6',
          )}
          aria-labelledby="plus"
        >
          <div className="flex flex-col gap-1">
            <h2 id="plus" className="text-h2">
              Plus
            </h2>
            <p className="nums text-h1">{period === 'month' ? '19 zł' : '190 zł'}</p>
            <p className="text-small text-text-muted">
              {period === 'month' ? 'miesięcznie' : 'rocznie, czyli 15,83 zł miesięcznie'}
            </p>
          </div>
          <Features items={plus} />
          <Button size="lg" block className="mt-auto" loading={loading} onClick={choosePlus}>
            Wybierz Plus
          </Button>
        </section>
      </div>

      <div className="flex items-start gap-3 text-ui text-text-muted">
        <Icon name="info-circle" className="mt-[3px]" />
        <p>
          <span className="font-medium text-text">Anuluj w każdej chwili.</span> Plan działa do
          końca opłaconego okresu. Potem wracasz do Free, a nadmiarowe wyjazdy wstrzymujemy, nie
          usuwamy.
        </p>
      </div>
    </Page>
  )
}
