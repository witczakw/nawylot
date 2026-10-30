import { useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { cx } from '../lib/format'
import { emptyPlan, examples, readPlan, type Plan } from '../lib/plan'
import { useApp } from '../state/app'
import { Button } from './Button'
import { Icon } from './Icon'
import { PlanChips } from './PlanChips'

const KEYS = ['idea', 'budget', 'when', 'from', 'people', 'scope'] as const

/** Okno opisu wyjazdu: tekst jak do znajomego, pod spodem na żywo „tak to rozumiemy”.
    Pola ustawione ręcznie mają pierwszeństwo przed tym, co odczytaliśmy z tekstu. */
export function Composer() {
  const { plan, setPlan, signedIn } = useApp()
  const navigate = useNavigate()
  const [text, setText] = useState(plan.text)
  const [manual, setManual] = useState<Partial<Plan>>({})
  const [error, setError] = useState<string>()
  const area = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])

  const derive = (t: string, m: Partial<Plan>) =>
    setPlan({ ...emptyPlan, text: t, ...readPlan(t), ...m })

  const onText = (t: string) => {
    setText(t)
    setError(undefined)
    derive(t, manual)
  }

  const onFacts = (patch: Partial<Plan>) => {
    const m = { ...manual, ...patch }
    setManual(m)
    setError(undefined)
    derive(text, m)
  }

  const applyExample = (t: string) => {
    setManual({})
    onText(t)
    area.current?.focus()
  }

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    if (!text.trim() && !plan.budget) {
      setError('Napisz, dokąd i kiedy chcesz jechać, albo uzupełnij pola poniżej.')
      area.current?.focus()
      return
    }
    if (!plan.budget) {
      setError(
        'Dopisz budżet, na przykład „do 2 500 zł na osobę”. Bez niego nie wiemy, kiedy dać znać.',
      )
      area.current?.focus()
      return
    }
    navigate(signedIn ? '/nowy' : '/logowanie?dalej=/nowy')
  }

  const filled = [
    plan.idea,
    plan.budget,
    plan.month ?? plan.nights,
    plan.airports[0],
    plan.people,
    plan.scope,
  ].filter((v) => v != null).length

  return (
    <form
      onSubmit={submit}
      noValidate
      className={cx(
        'flex flex-col overflow-hidden rounded-card border bg-surface transition-colors',
        error ? 'border-danger' : 'border-border-ctl',
        'has-[textarea:focus]:border-accent has-[textarea:focus]:shadow-focus',
      )}
    >
      <div className="flex flex-col gap-2 px-5 pt-5 md:px-6">
        <label htmlFor="opis" className="text-label text-text-muted">
          Opisz wyjazd, jak znajomemu
        </label>
        <textarea
          id="opis"
          ref={area}
          rows={3}
          value={text}
          onChange={(e) => onText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'opis-blad' : undefined}
          placeholder="Na przykład: gdzieś ciepło, 7 nocy w lutym, do 2 500 zł na osobę, z Poznania lub Berlina"
          className="block min-h-[96px] w-full resize-none bg-transparent pb-4 text-body text-text outline-none placeholder:text-text-muted md:text-h2 md:font-normal"
        />
        {error && (
          <p
            id="opis-blad"
            role="alert"
            className="flex items-start gap-1 pb-4 text-small text-danger"
          >
            <Icon name="alert-circle" className="mt-px" />
            {error}
          </p>
        )}
      </div>

      {!text && (
        <div className="flex flex-wrap items-center gap-2 px-5 pb-5 md:px-6">
          <span className="text-small text-text-muted">Na przykład:</span>
          {examples.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => applyExample(ex.text)}
              className="h-8 rounded-pill border border-border-ctl px-3 text-small transition-colors hover:bg-hover focus-visible:shadow-focus"
            >
              {ex.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-border bg-surface-2 px-5 py-5 md:px-6">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-label text-text">Tak to rozumiemy</p>
          <p className="nums text-small text-text-muted" aria-live="polite">
            {filled} z {KEYS.length} uzupełnione, kliknij, żeby zmienić
          </p>
        </div>
        <PlanChips plan={plan} onChange={onFacts} keys={[...KEYS]} variant="facts" />
      </div>

      <div className="flex flex-col gap-3 border-t border-border px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <p className="hidden text-small text-text-muted md:block">
          Enter, żeby zacząć. Shift i Enter, żeby przejść do nowej linii.
        </p>
        <Button type="submit" size="lg" block className="md:w-auto">
          Zacznij pilnować
        </Button>
      </div>
    </form>
  )
}
