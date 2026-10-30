import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cx } from '../lib/format'
import { Icon, Spinner } from './Icon'

type FieldState = 'hover' | 'focus'

/** Krawędź, hover i fokus wspólne dla wszystkich pól, w które się pisze lub wybiera. */
export const controlEdge = cx(
  'rounded-control border border-border-ctl bg-surface text-text transition-colors',
  'hover:border-text-muted data-[state=hover]:border-text-muted',
  'focus:border-accent focus:shadow-focus data-[state=focus]:border-accent data-[state=focus]:shadow-focus',
  'aria-[invalid=true]:border-danger',
  'disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-2 disabled:text-text-muted',
)

interface FrameProps {
  id: string
  label: string
  hint?: ReactNode
  error?: string
  hideLabel?: boolean
  children: ReactNode
}

export function FieldFrame({ id, label, hint, error, hideLabel, children }: FrameProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={cx('text-label text-text', hideLabel && 'sr-only')}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="flex items-start gap-1 text-small text-danger">
          <Icon name="alert-circle" className="mt-px" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-msg`} className="text-small text-text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  hint?: ReactNode
  error?: string
  suffix?: string
  loading?: boolean
  hideLabel?: boolean
  size?: 'md' | 'lg'
  state?: FieldState
}

export function TextField({
  label,
  hint,
  error,
  suffix,
  loading,
  hideLabel,
  size = 'lg',
  state,
  className,
  id,
  ...rest
}: TextFieldProps) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <FieldFrame id={fid} label={label} hint={hint} error={error} hideLabel={hideLabel}>
      <div className="relative">
        <input
          id={fid}
          data-state={state}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${fid}-msg` : undefined}
          className={cx(
            controlEdge,
            'w-full px-3 placeholder:text-text-muted',
            size === 'lg' ? 'h-12 text-body' : 'h-10 text-ui',
            (suffix || loading) && 'pr-12',
            className,
          )}
          {...rest}
        />
        {(suffix || loading) && (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-ui text-text-muted">
            {loading ? <Spinner /> : suffix}
          </span>
        )}
      </div>
    </FieldFrame>
  )
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: ReactNode
  error?: string
  hideLabel?: boolean
  state?: FieldState
}

export function TextArea({
  label,
  hint,
  error,
  hideLabel,
  state,
  className,
  id,
  ...rest
}: TextAreaProps) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <FieldFrame id={fid} label={label} hint={hint} error={error} hideLabel={hideLabel}>
      <textarea
        id={fid}
        data-state={state}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${fid}-msg` : undefined}
        className={cx(
          controlEdge,
          'block w-full resize-none px-4 py-3 text-body placeholder:text-text-muted',
          className,
        )}
        {...rest}
      />
    </FieldFrame>
  )
}
