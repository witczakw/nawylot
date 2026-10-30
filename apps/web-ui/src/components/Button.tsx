import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cx } from '../lib/format'
import { Icon, Spinner, type IconName } from './Icon'

/** Wymuszony stan, tylko do podglądu na /komponenty. */
export type ForcedState = 'hover' | 'focus' | 'active'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: IconName
  iconRight?: IconName
  block?: boolean
  iconOnly?: boolean
  state?: ForcedState
}

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-fg hover:bg-accent-hover data-[state=hover]:bg-accent-hover active:bg-accent-press data-[state=active]:bg-accent-press disabled:bg-surface-2 disabled:text-text-muted',
  secondary:
    'bg-surface-2 text-text hover:bg-surface-2-hover data-[state=hover]:bg-surface-2-hover active:bg-press data-[state=active]:bg-press disabled:bg-surface-2 disabled:text-text-muted',
  ghost:
    'bg-transparent text-text hover:bg-hover data-[state=hover]:bg-hover active:bg-press data-[state=active]:bg-press disabled:bg-transparent disabled:text-text-muted',
  danger:
    'bg-danger text-danger-fg hover:bg-danger-hover data-[state=hover]:bg-danger-hover active:bg-danger-hover data-[state=active]:bg-danger-hover disabled:bg-surface-2 disabled:text-text-muted',
  'danger-ghost':
    'bg-transparent text-danger hover:bg-tag-red data-[state=hover]:bg-tag-red active:bg-tag-red data-[state=active]:bg-tag-red disabled:bg-transparent disabled:text-text-muted',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-small',
  md: 'h-10 px-4 text-ui',
  lg: 'h-12 px-6 text-body',
}

const iconOnlySizes: Record<Size, string> = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading,
    icon,
    iconRight,
    block,
    iconOnly,
    state,
    className,
    children,
    onClick,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      data-state={state}
      aria-busy={loading || undefined}
      onClick={loading ? (e) => e.preventDefault() : onClick}
      className={cx(
        'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-control font-semibold transition-colors',
        'focus-visible:shadow-focus data-[state=focus]:shadow-focus disabled:cursor-not-allowed',
        variants[variant],
        iconOnly ? cx(iconOnlySizes[size], 'px-0') : sizes[size],
        block && 'w-full',
        loading && 'cursor-progress',
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : icon && <Icon name={icon} />}
      {iconOnly ? <span className="sr-only">{children}</span> : children}
      {!loading && iconRight && <Icon name={iconRight} />}
    </button>
  )
})
