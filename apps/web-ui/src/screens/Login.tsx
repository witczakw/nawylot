import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { OtpInput } from '../components/Bits'
import { Button } from '../components/Button'
import { TextField } from '../components/Field'
import { Spinner } from '../components/Icon'
import { Page, PageHead, StickyAction } from '../components/Layout'
import { useToast } from '../components/Toast'
import { user } from '../data/mock'
import { useApp } from '../state/app'

const RESEND_AFTER = 30

export function Login() {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState(user.email)
  return step === 'email' ? (
    <EmailStep email={email} setEmail={setEmail} onSent={() => setStep('code')} />
  ) : (
    <CodeStep email={email} onBack={() => setStep('email')} />
  )
}

function EmailStep({
  email,
  setEmail,
  onSent,
}: {
  email: string
  setEmail: (v: string) => void
  onSent: () => void
}) {
  const [error, setError] = useState<string>()
  const [sending, setSending] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      return setError('Ten adres wygląda na niepełny. Sprawdź, czy ma @ i domenę.')
    setSending(true)
    window.setTimeout(onSent, 700)
  }

  return (
    <Page sticky width="narrow">
      <PageHead
        title="Zaloguj się"
        lead="Wyślemy Ci 6-cyfrowy kod na e-mail. Nie potrzebujesz hasła."
      />
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <TextField
          label="Adres e-mail"
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          disabled={sending}
          error={error}
          onChange={(e) => {
            setEmail(e.target.value)
            setError(undefined)
          }}
        />
        <StickyAction>
          <Button type="submit" size="lg" block className="md:w-auto" loading={sending}>
            Wyślij kod
          </Button>
        </StickyAction>
      </form>
    </Page>
  )
}

function CodeStep({ email, onBack }: { email: string; onBack: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()
  const [checking, setChecking] = useState(false)
  const [wait, setWait] = useState(RESEND_AFTER)
  const { setSignedIn } = useApp()
  const toast = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  useEffect(() => {
    if (wait <= 0) return
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000)
    return () => window.clearTimeout(t)
  }, [wait])

  const verify = (c: string) => {
    if (c.length < 6) return setError('Kod ma 6 cyfr. Brakuje jeszcze ' + (6 - c.length) + '.')
    setChecking(true)
    window.setTimeout(() => {
      setChecking(false)
      if (c === '000000') {
        setError('Ten kod nie pasuje. Sprawdź ostatni e-mail od nas albo wyślij nowy kod.')
        return
      }
      setSignedIn(true)
      toast({
        kind: 'success',
        title: 'Zalogowano',
        description: 'Teraz potwierdź, czego mamy pilnować.',
      })
      navigate(params.get('dalej') ?? '/wyjazdy')
    }, 800)
  }

  const resend = () => {
    setWait(RESEND_AFTER)
    setCode('')
    setError(undefined)
    toast({
      kind: 'info',
      title: 'Wysłaliśmy nowy kod',
      description: 'Poprzedni kod przestał działać.',
    })
  }

  return (
    <Page sticky width="narrow">
      <PageHead
        title="Wpisz kod z e-maila"
        lead={
          <>
            Wysłaliśmy go na <span className="font-medium text-text">{email}</span>. Kod działa
            przez 10 minut.
          </>
        }
      />
      <form
        noValidate
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault()
          verify(code)
        }}
      >
        <div className="flex flex-col gap-2">
          <OtpInput
            value={code}
            disabled={checking}
            error={Boolean(error)}
            onChange={(v) => {
              setCode(v)
              setError(undefined)
            }}
            onComplete={verify}
          />
          {error ? (
            <p role="alert" className="text-small text-danger">
              {error}
            </p>
          ) : checking ? (
            <p className="flex items-center gap-2 text-small text-text-muted">
              <Spinner /> Sprawdzamy kod
            </p>
          ) : (
            <p className="text-small text-text-muted">
              Możesz wkleić cały kod naraz. W podglądzie działa każdy kod poza 000000.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" disabled={wait > 0} onClick={resend}>
            {wait > 0 ? `Wyślij ponownie za 0:${String(wait).padStart(2, '0')}` : 'Wyślij ponownie'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onBack}>
            Zmień adres
          </Button>
        </div>
        <StickyAction>
          <Button
            type="submit"
            size="lg"
            block
            className="md:w-auto"
            loading={checking}
            disabled={code.length < 6}
          >
            Zaloguj się
          </Button>
        </StickyAction>
      </form>
    </Page>
  )
}
