import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { initialWatches, type Watch } from '../data/mock'
import { emptyPlan, type Plan } from '../lib/plan'

export type Theme = 'system' | 'light' | 'dark'
export type Channel = 'email' | 'whatsapp'

interface AppState {
  signedIn: boolean
  setSignedIn: (v: boolean) => void
  plan: Plan
  setPlan: Dispatch<SetStateAction<Plan>>
  channel: Channel
  setChannel: (c: Channel) => void
  watches: Watch[]
  setWatches: Dispatch<SetStateAction<Watch[]>>
  theme: Theme
  setTheme: (t: Theme) => void
}

const Ctx = createContext<AppState | null>(null)

export function useApp() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp poza AppProvider')
  return v
}

const THEME_KEY = 'nawylot-theme'

function readTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY)
    return t === 'light' || t === 'dark' ? t : 'system'
  } catch {
    return 'system'
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false)
  const [plan, setPlan] = useState<Plan>(emptyPlan)
  const [channel, setChannel] = useState<Channel>('email')
  const [watches, setWatches] = useState<Watch[]>(initialWatches)
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') delete root.dataset.theme
    else root.dataset.theme = theme
    try {
      if (theme === 'system') localStorage.removeItem(THEME_KEY)
      else localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* brak dostępu do storage: motyw działa do końca sesji */
    }
  }, [theme])

  return (
    <Ctx.Provider
      value={{
        signedIn,
        setSignedIn,
        plan,
        setPlan,
        channel,
        setChannel,
        watches,
        setWatches,
        theme,
        setTheme,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}
