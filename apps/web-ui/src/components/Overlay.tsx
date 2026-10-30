import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../lib/format'
import { Button } from './Button'

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

interface LayerProps {
  open: boolean
  onClose: () => void
  /** Zapis w toku: scrim i Esc nie zamykają. */
  locked?: boolean
  kind: 'dialog' | 'sheet'
  title: string
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  role?: 'dialog' | 'alertdialog'
}

function Layer({
  open,
  onClose,
  locked,
  kind,
  title,
  description,
  children,
  footer,
  role = 'dialog',
}: LayerProps) {
  const panel = useRef<HTMLDivElement>(null)
  const id = useId()
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const lockedRef = useRef(locked)
  lockedRef.current = locked

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const el = panel.current
    const first =
      el?.querySelector<HTMLElement>('[data-autofocus]') ??
      el?.querySelector<HTMLElement>('input:not([disabled]), textarea, [role=combobox]') ??
      el?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !lockedRef.current) {
        e.preventDefault()
        closeRef.current()
      }
      if (e.key === 'Tab' && el) {
        const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE))
        const a = items[0]
        const z = items[items.length - 1]
        if (!a || !z) return
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault()
          z.focus()
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault()
          a.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className={cx(
        'fixed inset-0 z-50 flex',
        kind === 'dialog' ? 'items-center justify-center p-4' : 'items-end justify-center',
      )}
    >
      <div
        className="absolute inset-0 animate-fade-in bg-scrim"
        onMouseDown={() => !locked && onClose()}
        aria-hidden="true"
      />
      <div
        ref={panel}
        role={role}
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-desc` : undefined}
        className={cx(
          'relative flex w-full flex-col border border-border bg-surface shadow-float',
          kind === 'dialog'
            ? 'max-w-dialog animate-rise-in rounded-sheet'
            : 'max-h-[88dvh] max-w-content animate-rise-in rounded-t-sheet border-b-0',
        )}
      >
        {kind === 'sheet' && (
          <div className="mx-auto mt-3 h-1 w-8 rounded-pill bg-border-ctl" aria-hidden="true" />
        )}
        <div className="flex flex-col gap-2 px-6 pt-6">
          <h2 id={`${id}-title`} className="text-h2">
            {title}
          </h2>
          {description && (
            <div id={`${id}-desc`} className="text-ui text-text-muted">
              {description}
            </div>
          )}
        </div>
        {children && <div className="flex flex-col gap-4 overflow-auto px-6 pt-6">{children}</div>}
        {footer && (
          <div className="pb-safe flex flex-wrap items-center justify-end gap-3 px-6 pt-6 md:pb-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

type PublicProps = Omit<LayerProps, 'kind'>

export const Dialog = (p: PublicProps) => <Layer kind="dialog" {...p} />
export const Sheet = (p: PublicProps) => <Layer kind="sheet" {...p} />

/** Standardowa stopka: Anuluj po lewej, akcja nazwana po tym, co robi, po prawej. */
export function LayerActions({
  onCancel,
  confirm,
  saving,
  disabled,
  danger,
  onConfirm,
}: {
  onCancel: () => void
  confirm: string
  saving?: boolean
  disabled?: boolean
  danger?: boolean
  onConfirm: () => void
}) {
  return (
    <>
      <Button variant="ghost" onClick={onCancel} disabled={saving}>
        Anuluj
      </Button>
      <Button
        variant={danger ? 'danger' : 'primary'}
        onClick={onConfirm}
        loading={saving}
        disabled={disabled}
      >
        {confirm}
      </Button>
    </>
  )
}
