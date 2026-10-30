import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { cx } from '../lib/format'
import { controlEdge, FieldFrame } from './Field'
import { Icon } from './Icon'

export interface SelectOption<T extends string> {
  value: T
  label: string
  hint?: string
}

interface SelectProps<T extends string> {
  label: string
  value: T | null
  options: SelectOption<T>[]
  onChange: (v: T) => void
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  size?: 'md' | 'lg'
  hideLabel?: boolean
  /** Tylko do podglądu na /komponenty. */
  defaultOpen?: boolean
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Wybierz',
  hint,
  error,
  disabled,
  size = 'lg',
  hideLabel,
  defaultOpen = false,
}: SelectProps<T>) {
  const id = useId()
  const [open, setOpen] = useState(defaultOpen)
  const selectedIndex = options.findIndex((o) => o.value === value)
  const [active, setActive] = useState(Math.max(0, selectedIndex))
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!open || defaultOpen) return
    const close = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open, defaultOpen])

  useEffect(() => {
    if (open)
      list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const openList = () => {
    setActive(Math.max(0, selectedIndex))
    setOpen(true)
  }

  const choose = (i: number) => {
    const opt = options[i]
    if (opt) onChange(opt.value)
    setOpen(false)
  }

  const onKey = (e: KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openList()
      }
      return
    }
    const last = options.length - 1
    const moves: Record<string, () => void> = {
      ArrowDown: () => setActive((a) => Math.min(last, a + 1)),
      ArrowUp: () => setActive((a) => Math.max(0, a - 1)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => choose(active),
      ' ': () => choose(active),
      Escape: () => setOpen(false),
    }
    const move = moves[e.key]
    if (move) {
      e.preventDefault()
      e.stopPropagation()
      move()
    } else if (e.key === 'Tab') setOpen(false)
  }

  const current = options[selectedIndex]

  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} hideLabel={hideLabel}>
      <div ref={root} className="relative">
        <button
          id={id}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          data-state={open ? 'focus' : undefined}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onKey}
          className={cx(
            controlEdge,
            'flex w-full items-center justify-between gap-2 px-3 text-left',
            size === 'lg' ? 'h-12 text-body' : 'h-10 text-ui',
          )}
        >
          <span className={cx('truncate', !current && 'text-text-muted')}>
            {current?.label ?? placeholder}
          </span>
          <Icon
            name="chevron-down"
            className={cx('text-text-muted transition-transform', open && 'rotate-180')}
          />
        </button>
        {open && (
          <ul
            ref={list}
            id={`${id}-list`}
            role="listbox"
            aria-labelledby={id}
            className="absolute inset-x-0 top-full z-30 mt-1 flex max-h-[264px] animate-drop-in flex-col gap-px overflow-auto rounded-control border border-border bg-surface p-1 shadow-float"
          >
            {options.map((o, i) => {
              const selected = o.value === value
              return (
                <li
                  key={o.value}
                  id={`${id}-opt-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={cx(
                    'flex cursor-pointer items-center justify-between gap-3 rounded-tag px-3 py-2 text-ui',
                    i === active && 'bg-hover',
                    selected && 'font-medium',
                  )}
                >
                  <span className="flex flex-col">
                    {o.label}
                    {o.hint && <span className="text-small text-text-muted">{o.hint}</span>}
                  </span>
                  {selected && <Icon name="check" />}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </FieldFrame>
  )
}
