import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cx } from '../lib/format'
import { Button } from './Button'
import { Icon, type IconName } from './Icon'

export type ToastKind = 'success' | 'info' | 'error'

export interface ToastInput {
  kind: ToastKind
  /** Co się stało. */
  title: string
  /** Co to oznacza. */
  description?: string
  action?: { label: string; onClick: () => void }
}

interface ToastItem extends ToastInput {
  id: number
}

const kindIcon: Record<ToastKind, { icon: IconName; color: string }> = {
  success: { icon: 'circle-check', color: 'text-success' },
  info: { icon: 'info-circle', color: 'text-text-muted' },
  error: { icon: 'alert-circle', color: 'text-danger' },
}

const MAX = 3
const LIFETIME = 5000

const ToastContext = createContext<(t: ToastInput) => void>(() => {})

export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setItems((all) => all.filter((t) => t.id !== id)), [])

  const push = useCallback(
    (t: ToastInput) => {
      const id = nextId.current++
      setItems((all) => [...all, { ...t, id }].slice(-MAX))
      if (t.kind !== 'error') window.setTimeout(() => dismiss(id), LIFETIME)
    },
    [dismiss],
  )

  const value = useMemo(() => push, [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-20 z-[60] flex flex-col gap-2 md:inset-x-auto md:bottom-6 md:right-6 md:w-toast">
        {items.map((t) => (
          <ToastView key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function ToastView({ toast, onDismiss }: { toast: ToastInput; onDismiss: () => void }) {
  const { icon, color } = kindIcon[toast.kind]
  const isError = toast.kind === 'error'
  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className="pointer-events-auto flex animate-rise-in items-start gap-3 rounded-card border border-border bg-surface p-4 shadow-float"
    >
      <Icon name={icon} size={20} className={cx('mt-px', color)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-ui font-semibold">{toast.title}</p>
        {toast.description && <p className="text-small text-text-muted">{toast.description}</p>}
        {toast.action && (
          <div className="pt-1">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                toast.action?.onClick()
                onDismiss()
              }}
            >
              {toast.action.label}
            </Button>
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        icon="x"
        onClick={onDismiss}
        className="-mr-2 -mt-2"
      >
        Zamknij powiadomienie
      </Button>
    </div>
  )
}
