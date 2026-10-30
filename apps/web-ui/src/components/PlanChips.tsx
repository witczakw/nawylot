import { useState } from 'react'
import { airports, months, nightOptions } from '../data/mock'
import { nights, people } from '../lib/format'
import { fromAirports, monthLabel, scopeLabel, type Plan, type Scope } from '../lib/plan'
import { Checkbox, Chip, Segmented, Tag } from './Choice'
import { TextField } from './Field'
import { LayerActions, Sheet } from './Overlay'
import { Select } from './Select'
import { cx, zl } from '../lib/format'
import { Icon, type IconName } from './Icon'

export type ChipKey = 'idea' | 'budget' | 'when' | 'from' | 'people' | 'scope'

interface Props {
  plan: Plan
  onChange: (patch: Partial<Plan>) => void
  keys?: ChipKey[]
  /** chips: rząd chipów filtra. facts: siatka „tak to rozumiemy” w oknie opisu wyjazdu. */
  variant?: 'chips' | 'facts'
}

export function PlanChips({
  plan,
  onChange,
  keys = ['budget', 'when', 'from', 'people', 'scope'],
  variant = 'chips',
}: Props) {
  const [open, setOpen] = useState<ChipKey | null>(null)
  const close = () => setOpen(null)
  const apply = (patch: Partial<Plan>) => {
    onChange(patch)
    close()
  }

  const when = [monthLabel(plan.month), plan.nights ? nights(plan.nights) : null]
    .filter(Boolean)
    .join(', ')
  const chips: Record<
    ChipKey,
    {
      label: string
      value: string | null
      icon: 'map-pin' | 'wallet' | 'calendar' | 'plane' | 'users' | 'bed'
    }
  > = {
    idea: { label: 'Dokąd', value: plan.idea, icon: 'map-pin' },
    budget: {
      label: 'Budżet',
      value: plan.budget ? `do ${zl(plan.budget)}/os.` : null,
      icon: 'wallet',
    },
    when: { label: 'Kiedy', value: when || null, icon: 'calendar' },
    from: {
      label: 'Skąd',
      value: plan.airports.length ? `z ${plan.airports.join(' lub ')}` : null,
      icon: 'plane',
    },
    people: { label: 'Ile osób', value: plan.people ? people(plan.people) : null, icon: 'users' },
    scope: {
      label: 'Lot / Nocleg / Oba',
      value: plan.scope ? scopeLabel[plan.scope] : null,
      icon: 'bed',
    },
  }

  return (
    <>
      {variant === 'chips' ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Szczegóły wyjazdu">
          {keys.map((k) => (
            <Chip key={k} {...chips[k]} onClick={() => setOpen(k)} />
          ))}
        </div>
      ) : (
        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-3"
          role="group"
          aria-label="Szczegóły wyjazdu"
        >
          {keys.map((k) => (
            <Fact
              key={k}
              {...chips[k]}
              label={k === 'scope' ? 'Zakres' : chips[k].label}
              required={k === 'budget'}
              onClick={() => setOpen(k)}
            />
          ))}
        </div>
      )}
      {open === 'idea' && <IdeaSheet plan={plan} onApply={apply} onClose={close} />}
      {open === 'budget' && <BudgetSheet plan={plan} onApply={apply} onClose={close} />}
      {open === 'when' && <WhenSheet plan={plan} onApply={apply} onClose={close} />}
      {open === 'from' && <FromSheet plan={plan} onApply={apply} onClose={close} />}
      {open === 'people' && <PeopleSheet plan={plan} onApply={apply} onClose={close} />}
      {open === 'scope' && <ScopeSheet plan={plan} onApply={apply} onClose={close} />}
    </>
  )
}

interface FactProps {
  label: string
  value: string | null
  icon: IconName
  required?: boolean
  onClick: () => void
}

function Fact({ label, value, icon, required, onClick }: FactProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={value ? `${label}: ${value}. Zmień` : `Ustaw: ${label}`}
      className={cx(
        'flex min-w-0 flex-col gap-1 rounded-control border px-3 py-2 text-left transition-colors focus-visible:shadow-focus',
        value
          ? 'border-border bg-surface hover:bg-hover'
          : 'border-border-ctl bg-transparent hover:bg-hover',
      )}
    >
      <span className="flex items-center gap-1 text-label text-text-muted">
        <Icon name={icon} />
        {label}
        {required && !value && <span className="ml-auto text-label text-text-muted">wymagane</span>}
      </span>
      {value ? (
        <span className="truncate text-ui font-medium">{value}</span>
      ) : (
        <span className="flex items-center gap-1 text-ui text-text-muted">
          <Icon name="plus" />
          Dodaj
        </span>
      )}
    </button>
  )
}

interface SheetProps {
  plan: Plan
  onApply: (p: Partial<Plan>) => void
  onClose: () => void
}

function IdeaSheet({ plan, onApply, onClose }: SheetProps) {
  const [idea, setIdea] = useState(plan.idea ?? '')
  const ideas = ['Ciepło', 'Plaża', 'Miasto', 'Narty', 'Dowolny kierunek']
  return (
    <Sheet
      open
      onClose={onClose}
      title="Dokąd chcesz jechać"
      description="Wpisz miasto, kraj albo klimat. Może być ogólnie."
      footer={
        <LayerActions
          onCancel={onClose}
          confirm="Ustaw kierunek"
          onConfirm={() => onApply({ idea: idea.trim() || null })}
        />
      }
    >
      <TextField
        label="Kierunek albo klimat"
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="Na przykład: Wyspy Kanaryjskie"
      />
      <div className="flex flex-wrap gap-2">
        {ideas.map((i) => (
          <Chip key={i} label={i} value={idea === i ? i : null} onClick={() => setIdea(i)} />
        ))}
      </div>
    </Sheet>
  )
}

function BudgetSheet({ plan, onApply, onClose }: SheetProps) {
  const [raw, setRaw] = useState(plan.budget ? String(plan.budget) : '')
  const [error, setError] = useState<string>()
  const submit = () => {
    const n = Number(raw.replace(/\D/g, ''))
    if (!n) return setError('Wpisz kwotę w złotych, na przykład 2500.')
    if (n < 300) return setError('Za mało na lot i nocleg. Wpisz co najmniej 300 zł.')
    onApply({ budget: n })
  }
  return (
    <Sheet
      open
      onClose={onClose}
      title="Ile chcesz wydać"
      description="Budżet na jedną osobę, za cały wyjazd."
      footer={<LayerActions onCancel={onClose} confirm="Ustaw budżet" onConfirm={submit} />}
    >
      <TextField
        label="Budżet na osobę"
        inputMode="numeric"
        suffix="zł"
        value={raw}
        error={error}
        hint="Liczymy cały koszt: lot, bagaż, nocleg i dojazd z lotniska."
        onChange={(e) => {
          setRaw(e.target.value)
          setError(undefined)
        }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className="nums"
      />
    </Sheet>
  )
}

function WhenSheet({ plan, onApply, onClose }: SheetProps) {
  const [month, setMonth] = useState(plan.month)
  const [n, setN] = useState(plan.nights ? String(plan.nights) : null)
  return (
    <Sheet
      open
      onClose={onClose}
      title="Kiedy i na jak długo"
      description="Sprawdzamy wszystkie wyloty w wybranym miesiącu."
      footer={
        <LayerActions
          onCancel={onClose}
          confirm="Ustaw termin"
          onConfirm={() => onApply({ month, nights: n ? Number(n) : null })}
        />
      }
    >
      <Select
        label="Miesiąc"
        value={month}
        onChange={setMonth}
        options={months.map((m) => ({ value: m.value, label: m.label }))}
        placeholder="Wybierz miesiąc"
      />
      <Select
        label="Długość wyjazdu"
        value={n}
        onChange={setN}
        options={nightOptions.map((x) => ({ value: String(x), label: nights(x) }))}
        placeholder="Wybierz liczbę nocy"
      />
    </Sheet>
  )
}

function FromSheet({ plan, onApply, onClose }: SheetProps) {
  const [codes, setCodes] = useState(plan.airports)
  const [error, setError] = useState<string>()
  const toggle = (c: string, on: boolean) => {
    setError(undefined)
    setCodes((all) => (on ? [...all, c] : all.filter((x) => x !== c)))
  }
  return (
    <Sheet
      open
      onClose={onClose}
      title="Skąd możesz wylecieć"
      description={
        fromAirports(codes)
          ? `Sprawdzamy wyloty ${fromAirports(codes)}.`
          : 'Zaznacz jedno lub kilka lotnisk.'
      }
      footer={
        <LayerActions
          onCancel={onClose}
          confirm="Ustaw lotniska"
          onConfirm={() =>
            codes.length
              ? onApply({ airports: codes })
              : setError('Wybierz co najmniej jedno lotnisko.')
          }
        />
      }
    >
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">Lotniska wylotu</legend>
        {airports.map((a) => (
          <Checkbox
            key={a.code}
            checked={codes.includes(a.code)}
            onChange={(on) => toggle(a.code, on)}
            label={
              <span className="flex items-center gap-2">
                {a.city} <Tag>{a.code}</Tag>
              </span>
            }
          />
        ))}
      </fieldset>
      {error && <p className="text-small text-danger">{error}</p>}
    </Sheet>
  )
}

function PeopleSheet({ plan, onApply, onClose }: SheetProps) {
  const [n, setN] = useState(plan.people ? String(plan.people) : '2')
  return (
    <Sheet
      open
      onClose={onClose}
      title="Ile osób jedzie"
      description="Cenę pokazujemy na osobę, ale szukamy miejsc dla wszystkich."
      footer={
        <LayerActions
          onCancel={onClose}
          confirm="Ustaw liczbę osób"
          onConfirm={() => onApply({ people: Number(n) })}
        />
      }
    >
      <Select
        label="Liczba osób"
        value={n}
        onChange={setN}
        options={[1, 2, 3, 4, 5, 6].map((x) => ({ value: String(x), label: people(x) }))}
      />
    </Sheet>
  )
}

function ScopeSheet({ plan, onApply, onClose }: SheetProps) {
  const [scope, setScope] = useState<Scope>(plan.scope ?? 'both')
  return (
    <Sheet
      open
      onClose={onClose}
      title="Czego mamy pilnować"
      description="Lot i nocleg pokazujemy razem, ale rezerwujesz je osobno, u dwóch partnerów."
      footer={
        <LayerActions
          onCancel={onClose}
          confirm="Ustaw zakres"
          onConfirm={() => onApply({ scope })}
        />
      }
    >
      <Segmented
        label="Zakres"
        value={scope}
        onChange={setScope}
        options={[
          { value: 'both', label: 'Oba' },
          { value: 'flight', label: 'Lot' },
          { value: 'stay', label: 'Nocleg' },
        ]}
      />
    </Sheet>
  )
}
