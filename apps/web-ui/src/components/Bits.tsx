import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { cx, zl } from '../lib/format'
import type { WatchStatus } from '../data/mock'
import { controlEdge } from './Field'
import { Tag } from './Choice'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx('animate-calm-pulse rounded-tag bg-surface-2', className)}
    />
  )
}

const statusTag: Record<
  WatchStatus,
  { tone: 'sea' | 'sun' | 'mist'; icon: 'search' | 'circle-check' | 'pause'; label: string }
> = {
  searching: { tone: 'sea', icon: 'search', label: 'Szukamy' },
  deal: { tone: 'sun', icon: 'circle-check', label: 'Jest okazja' },
  paused: { tone: 'mist', icon: 'pause', label: 'Wstrzymane' },
}

export function StatusTag({ status }: { status: WatchStatus }) {
  const s = statusTag[status]
  return (
    <Tag tone={s.tone} icon={s.icon}>
      {s.label}
    </Tag>
  )
}

interface SparklineProps {
  prices: number[]
  budget: number
  width?: number
  height?: number
  className?: string
}

/** Trend najniższej ceny względem linii budżetu (przerywana). */
export function Sparkline({ prices, budget, width = 72, height = 32, className }: SparklineProps) {
  const all = [...prices, budget]
  const min = Math.min(...all)
  const max = Math.max(...all)
  const pad = (max - min) * 0.15 || 1
  const lo = min - pad
  const hi = max + pad
  const y = (v: number) => height - ((v - lo) / (hi - lo)) * height
  const x = (i: number) => 3 + (i * (width - 6)) / Math.max(1, prices.length - 1)
  const d = prices.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p).toFixed(1)}`).join(' ')
  const last = prices[prices.length - 1] ?? budget
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Najniższa cena spadła z ${zl(prices[0] ?? last)} do ${zl(last)}, budżet ${zl(budget)}`}
      className={cx('shrink-0 overflow-visible text-text', className)}
    >
      <line
        x1={0}
        x2={width}
        y1={y(budget)}
        y2={y(budget)}
        className="stroke-text-muted"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={x(prices.length - 1)} cy={y(last)} r={2.5} fill="currentColor" />
    </svg>
  )
}

interface OtpProps {
  value: string
  onChange: (v: string) => void
  onComplete?: (v: string) => void
  error?: boolean
  disabled?: boolean
  length?: number
}

/** Kod jednorazowy: przeskakuje do następnej kratki, obsługuje wklejanie i Backspace. */
export function OtpInput({ value, onChange, onComplete, error, disabled, length = 6 }: OtpProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  const set = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, length)
    onChange(clean)
    if (clean.length === length) onComplete?.(clean)
  }

  const onInput = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, '').slice(-1)
    if (!d) return
    const arr = [...digits]
    arr[i] = d
    set(arr.join(''))
    refs.current[Math.min(length - 1, i + 1)]?.focus()
  }

  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const arr = [...digits]
      if (arr[i]) arr[i] = ''
      else if (i > 0) {
        arr[i - 1] = ''
        refs.current[i - 1]?.focus()
      }
      onChange(arr.join('').slice(0, length))
    }
    if (e.key === 'ArrowLeft') refs.current[i - 1]?.focus()
    if (e.key === 'ArrowRight') refs.current[i + 1]?.focus()
  }

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '')
    if (!text) return
    e.preventDefault()
    set(text)
    refs.current[Math.min(length - 1, text.length)]?.focus()
  }

  return (
    <div className="grid grid-cols-6 gap-2" role="group" aria-label="Kod z e-maila, 6 cyfr">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Cyfra ${i + 1}`}
          aria-invalid={error || undefined}
          disabled={disabled}
          maxLength={2}
          onChange={(e) => onInput(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
          data-autofocus={i === 0 || undefined}
          className={cx(controlEdge, 'nums h-12 w-full min-w-0 text-center text-h2')}
        />
      ))}
    </div>
  )
}
