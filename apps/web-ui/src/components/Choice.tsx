import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '../lib/format'
import type { ForcedState } from './Button'
import { Icon, type IconName } from './Icon'

/* Kontrolki wyboru: checkbox, przełącznik, przełącznik segmentowy, chip filtra, tag. */

interface CheckboxProps {
  checked: boolean
  onChange: (v: boolean) => void
  label: ReactNode
  description?: string
  disabled?: boolean
  state?: 'focus'
  autoFocus?: boolean
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled,
  state,
  autoFocus,
}: CheckboxProps) {
  return (
    <label
      className={cx(
        'flex items-start gap-3',
        disabled ? 'cursor-not-allowed text-text-muted' : 'cursor-pointer',
      )}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        autoFocus={autoFocus}
        data-autofocus={autoFocus || undefined}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        data-state={state}
        className={cx(
          'mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-tag border transition-colors',
          'peer-focus-visible:shadow-focus data-[state=focus]:shadow-focus',
          checked ? 'border-text bg-text text-surface' : 'border-border-ctl bg-surface',
          !checked && !disabled && 'hover:border-text-muted',
          disabled && 'border-border bg-surface-2 opacity-60',
        )}
      >
        {checked && <Icon name="check" />}
      </span>
      <span className="flex flex-col">
        <span className="text-ui">{label}</span>
        {description && <span className="text-small text-text-muted">{description}</span>}
      </span>
    </label>
  )
}

interface SwitchProps {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  disabled?: boolean
  state?: 'focus'
}

export function Switch({ checked, onChange, label, disabled, state }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      data-state={state}
      onClick={() => onChange(!checked)}
      className={cx(
        'inline-flex h-6 w-10 shrink-0 items-center rounded-pill border p-[3px] transition-colors',
        'focus-visible:shadow-focus data-[state=focus]:shadow-focus disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'border-text bg-text' : 'border-border-ctl bg-surface-2 hover:border-text-muted',
      )}
    >
      <span
        className={cx(
          'h-4 w-4 rounded-pill transition-transform',
          checked ? 'translate-x-4 bg-surface' : 'translate-x-0 bg-text-muted',
        )}
      />
    </button>
  )
}

export interface SegmentOption<T extends string> {
  value: T
  label: string
  icon?: IconName
}

interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: SegmentOption<T>[]
  onChange: (v: T) => void
  disabled?: boolean
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: SegmentedProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const onKey = (e: KeyboardEvent, i: number) => {
    const dir =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0
    if (!dir) return
    e.preventDefault()
    const next = (i + dir + options.length) % options.length
    const opt = options[next]
    if (opt) onChange(opt.value)
    refs.current[next]?.focus()
  }
  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={cx(
        'flex w-full gap-1 rounded-control border border-border-ctl bg-surface-2 p-1',
        disabled && 'opacity-50',
      )}
    >
      {options.map((o, i) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={cx(
              'flex h-8 flex-1 items-center justify-center gap-2 rounded-tag border px-3 text-ui font-medium transition-colors focus-visible:shadow-focus disabled:cursor-not-allowed',
              selected
                ? 'border-border bg-surface text-text'
                : 'border-transparent text-text-muted hover:bg-hover hover:text-text',
            )}
          >
            {o.icon && <Icon name={o.icon} />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

interface ChipProps {
  label: string
  value?: string | null
  icon?: IconName
  onClick?: () => void
  state?: ForcedState
  disabled?: boolean
}

/** Chip filtra: pusty pokazuje nazwę i plus, wypełniony pokazuje wartość. */
export function Chip({ label, value, icon, onClick, state, disabled }: ChipProps) {
  const filled = Boolean(value)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-state={state}
      aria-label={filled ? `${label}: ${value}. Zmień` : `Ustaw: ${label}`}
      className={cx(
        'inline-flex h-8 items-center gap-1 rounded-pill border px-3 text-ui transition-colors',
        'focus-visible:shadow-focus data-[state=focus]:shadow-focus disabled:cursor-not-allowed disabled:opacity-50',
        filled
          ? 'border-border-ctl bg-surface-2 text-text hover:bg-surface-2-hover data-[state=hover]:bg-surface-2-hover'
          : 'border-border-ctl bg-surface text-text-muted hover:bg-hover hover:text-text data-[state=hover]:bg-hover',
        'active:bg-press data-[state=active]:bg-press',
      )}
    >
      <Icon name={filled ? (icon ?? 'check') : 'plus'} />
      {filled ? value : label}
    </button>
  )
}

export type Tone = 'mist' | 'sun' | 'sea' | 'green' | 'red'

const tones: Record<Tone, string> = {
  mist: 'bg-tag-mist text-tag-mist-fg',
  sun: 'bg-tag-sun text-tag-sun-fg',
  sea: 'bg-tag-sea text-tag-sea-fg',
  green: 'bg-tag-green text-tag-green-fg',
  red: 'bg-tag-red text-tag-red-fg',
}

export function Tag({
  tone = 'mist',
  icon,
  children,
}: {
  tone?: Tone
  icon?: IconName
  children: ReactNode
}) {
  return (
    <span
      className={cx(
        'inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-tag px-2 text-label',
        tones[tone],
      )}
    >
      {icon && <Icon name={icon} />}
      {children}
    </span>
  )
}
