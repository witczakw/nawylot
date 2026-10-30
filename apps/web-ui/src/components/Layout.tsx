import type { ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { cx } from '../lib/format'
import { useApp, type Theme } from '../state/app'
import { Icon, type IconName } from './Icon'

const nav: Array<{ to: string; label: string; icon: IconName }> = [
  { to: '/wyjazdy', label: 'Wyjazdy', icon: 'list' },
  { to: '/plany', label: 'Plany', icon: 'credit-card' },
  { to: '/ustawienia', label: 'Ustawienia', icon: 'settings' },
]

const previews: Array<[string, string]> = [
  ['/', 'Start'],
  ['/logowanie', 'Logowanie'],
  ['/nowy', 'Potwierdzenie'],
  ['/wyjazdy', 'Wyjazdy'],
  ['/wyjazdy?stan=pusto', 'Wyjazdy, pusto'],
  ['/wyjazdy?stan=ladowanie', 'Wyjazdy, ładowanie'],
  ['/okazja/teneryfa', 'Okazja'],
  ['/podglad-alertu', 'Podgląd alertu'],
  ['/plany', 'Plany'],
  ['/ustawienia', 'Ustawienia'],
  ['/komponenty', 'Komponenty'],
]

const nextTheme: Record<Theme, { next: Theme; icon: IconName; label: string }> = {
  system: { next: 'light', icon: 'device-desktop', label: 'Motyw systemowy. Przełącz na jasny' },
  light: { next: 'dark', icon: 'sun', label: 'Motyw jasny. Przełącz na ciemny' },
  dark: { next: 'system', icon: 'moon', label: 'Motyw ciemny. Przełącz na systemowy' },
}

export function Shell() {
  const { signedIn, theme, setTheme } = useApp()
  const { pathname } = useLocation()
  const t = nextTheme[theme]
  const showNav = signedIn || !['/', '/logowanie'].includes(pathname)

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#tresc"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-control focus:bg-surface focus:p-3 focus:shadow-focus"
      >
        Przejdź do treści
      </a>
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-wide items-center justify-between gap-4 px-4 md:px-6">
          <Link to="/" className="rounded-tag text-body font-bold focus-visible:shadow-focus">
            nawylot
          </Link>
          <div className="flex items-center gap-1">
            {showNav ? (
              <nav aria-label="Główna" className="flex items-center gap-1">
                {nav.map((n) => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    aria-label={n.label}
                    className={({ isActive }) =>
                      cx(
                        'flex h-10 items-center gap-2 rounded-control px-3 text-ui transition-colors focus-visible:shadow-focus',
                        isActive
                          ? 'bg-hover font-medium text-text'
                          : 'text-text-muted hover:bg-hover hover:text-text',
                      )
                    }
                  >
                    <Icon name={n.icon} size={20} />
                    <span className="hidden md:inline">{n.label}</span>
                  </NavLink>
                ))}
              </nav>
            ) : (
              <Link
                to="/logowanie"
                className="flex h-10 items-center rounded-control px-3 text-ui font-medium transition-colors hover:bg-hover focus-visible:shadow-focus"
              >
                Zaloguj się
              </Link>
            )}
            <button
              type="button"
              onClick={() => setTheme(t.next)}
              title={t.label}
              aria-label={t.label}
              className="flex h-10 w-10 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-hover hover:text-text focus-visible:shadow-focus"
            >
              <Icon name={t.icon} size={20} />
            </button>
          </div>
        </div>
      </header>
      <main id="tresc" className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-wide flex-col gap-3 px-4 py-8 pb-20 md:px-6 md:pb-8">
          <p className="text-label text-text-muted">Podgląd ekranów</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-small">
            {previews.map(([to, label]) => (
              <li key={to}>
                <Link
                  to={to}
                  className="rounded-tag text-text-muted underline-offset-4 hover:text-text hover:underline focus-visible:shadow-focus"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  )
}

const widths = { narrow: 'max-w-content', mid: 'max-w-mid', wide: 'max-w-wide' } as const

export function Page({
  children,
  sticky,
  width = 'wide',
  className,
}: {
  children: ReactNode
  sticky?: boolean
  width?: keyof typeof widths
  className?: string
}) {
  return (
    <div
      className={cx(
        'mx-auto flex w-full flex-col gap-8 px-4 py-8 md:px-6 md:py-12',
        widths[width],
        sticky && 'pb-20 md:pb-12',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Tytuł mówi, co się stało; druga linia, co to znaczy. */
export function PageHead({
  title,
  lead,
  children,
}: {
  title: string
  lead?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-2">
      {children}
      <h1 className="text-balance text-h1">{title}</h1>
      {lead && <p className="max-w-content text-body text-text-muted">{lead}</p>}
    </header>
  )
}

/** Mobile: przyklejony do dołu ekranu. Desktop: kończy treść. */
export function StickyAction({ children }: { children: ReactNode }) {
  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg px-4 pt-3 md:static md:z-auto md:border-0 md:bg-transparent md:p-0">
      <div className="mx-auto flex max-w-wide flex-col gap-3 md:flex-row md:justify-end">
        {children}
      </div>
    </div>
  )
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-card border border-border bg-surface', className)}>{children}</div>
  )
}
