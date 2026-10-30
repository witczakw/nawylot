import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Checkbox, Segmented, Switch, Tag } from '../components/Choice'
import { Icon, type IconName } from '../components/Icon'
import { Card, Page, PageHead, StickyAction } from '../components/Layout'
import { Dialog, LayerActions } from '../components/Overlay'
import { Select } from '../components/Select'
import { useToast } from '../components/Toast'
import { airports, user } from '../data/mock'
import { plural } from '../lib/format'
import { useApp, type Theme } from '../state/app'

const hours = Array.from({ length: 24 }, (_, h) => {
  const v = `${String(h).padStart(2, '0')}:00`
  return { value: v, label: v }
})

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-h2">{title}</h2>
      {children}
    </section>
  )
}

function Row({
  icon,
  title,
  detail,
  children,
}: {
  icon?: IconName
  title: string
  detail?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {icon && <Icon name={icon} className="text-text-muted" />}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-ui font-medium">{title}</span>
        {detail && <span className="truncate text-small text-text-muted">{detail}</span>}
      </div>
      {children}
    </div>
  )
}

export function Settings() {
  const { theme, setTheme, setSignedIn, watches } = useApp()
  const toast = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState(true)
  const [whatsapp, setWhatsapp] = useState(false)
  const [home, setHome] = useState(['POZ', 'BER'])
  const [quiet, setQuiet] = useState(true)
  const [quietFrom, setQuietFrom] = useState('22:00')
  const [quietTo, setQuietTo] = useState('07:00')
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [understood, setUnderstood] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const noChannel = !email && !whatsapp
  const available = airports.filter((a) => !home.includes(a.code))

  const save = () => {
    if (noChannel) return
    setSaving(true)
    window.setTimeout(() => {
      setSaving(false)
      toast({
        kind: 'success',
        title: 'Zapisaliśmy ustawienia',
        description: 'Zmiany działają od następnego sprawdzenia cen.',
      })
    }, 700)
  }

  const removeAccount = () => {
    setDeleting(true)
    window.setTimeout(() => {
      setSignedIn(false)
      toast({
        kind: 'success',
        title: 'Usunęliśmy konto',
        description: 'Wszystkie dane znikną z naszych serwerów w ciągu 30 dni.',
      })
      navigate('/')
    }, 900)
  }

  return (
    <Page sticky>
      <PageHead title="Ustawienia" />

      <div className="grid items-start gap-x-12 gap-y-8 lg:grid-cols-2">
        <Section title="Alerty">
          <Card className="divide-y divide-border">
            <Row icon="mail" title="E-mail" detail={user.email}>
              <Switch label="Alerty e-mailem" checked={email} onChange={setEmail} />
            </Row>
            <Row icon="message" title="WhatsApp" detail={user.phone}>
              <Tag tone="green">Plus</Tag>
              <Switch label="Alerty na WhatsApp" checked={whatsapp} onChange={setWhatsapp} />
            </Row>
          </Card>
          {noChannel && (
            <p className="flex items-start gap-1 text-small text-danger" role="alert">
              <Icon name="alert-circle" className="mt-px" />
              Włącz co najmniej jeden kanał, inaczej nie damy znać o okazji.
            </p>
          )}
        </Section>

        <Section title="Lotniska startowe">
          <Card className="divide-y divide-border">
            {home.map((code) => {
              const a = airports.find((x) => x.code === code)
              return (
                <Row key={code} title={a?.city ?? code}>
                  <Tag>{code}</Tag>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    icon="x"
                    disabled={home.length === 1}
                    onClick={() => setHome((h) => h.filter((c) => c !== code))}
                  >
                    Usuń {a?.city}
                  </Button>
                </Row>
              )
            })}
            {available.length > 0 && (
              <div className="px-4 py-3">
                <Select
                  label="Dodaj lotnisko"
                  hideLabel
                  size="md"
                  value={null}
                  placeholder="Dodaj lotnisko"
                  options={available.map((a) => ({
                    value: a.code,
                    label: `${a.city} (${a.code})`,
                  }))}
                  onChange={(c) => setHome((h) => [...h, c])}
                />
              </div>
            )}
          </Card>
        </Section>

        <Section title="Cisza nocna">
          <Card className="divide-y divide-border">
            <Row
              title="Nie wysyłaj alertów w nocy"
              detail="Alert znaleziony w nocy dostaniesz rano."
            >
              <Switch label="Cisza nocna" checked={quiet} onChange={setQuiet} />
            </Row>
            <div className="grid grid-cols-2 gap-3 px-4 py-3">
              <Select
                label="Od"
                size="md"
                value={quietFrom}
                onChange={setQuietFrom}
                options={hours}
                disabled={!quiet}
              />
              <Select
                label="Do"
                size="md"
                value={quietTo}
                onChange={setQuietTo}
                options={hours}
                disabled={!quiet}
              />
            </div>
          </Card>
        </Section>

        <Section title="Wygląd">
          <Segmented<Theme>
            label="Motyw"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'system', label: 'Systemowy', icon: 'device-desktop' },
              { value: 'light', label: 'Jasny', icon: 'sun' },
              { value: 'dark', label: 'Ciemny', icon: 'moon' },
            ]}
          />
        </Section>

        <Section title="Konto">
          <Card className="divide-y divide-border">
            <Row icon="user" title="Adres e-mail" detail={user.email} />
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                icon="logout"
                onClick={() => {
                  setSignedIn(false)
                  navigate('/')
                }}
              >
                Wyloguj się
              </Button>
              <Button
                variant="danger-ghost"
                size="sm"
                icon="trash"
                onClick={() => setDeleteOpen(true)}
              >
                Usuń konto
              </Button>
            </div>
          </Card>
        </Section>
      </div>

      <StickyAction>
        <Button
          size="lg"
          block
          className="md:w-auto"
          loading={saving}
          disabled={noChannel}
          onClick={save}
        >
          Zapisz ustawienia
        </Button>
      </StickyAction>

      <Dialog
        open={deleteOpen}
        role="alertdialog"
        locked={deleting}
        onClose={() => {
          setDeleteOpen(false)
          setUnderstood(false)
        }}
        title="Usunąć konto?"
        description={`Usuniemy konto ${user.email}, ${watches.length} ${plural(watches.length, ['pilnowany wyjazd', 'pilnowane wyjazdy', 'pilnowanych wyjazdów'])} i całą historię cen. Tego nie da się cofnąć.`}
        footer={
          <LayerActions
            onCancel={() => {
              setDeleteOpen(false)
              setUnderstood(false)
            }}
            confirm="Usuń konto i dane"
            danger
            saving={deleting}
            disabled={!understood}
            onConfirm={removeAccount}
          />
        }
      >
        <Checkbox
          autoFocus
          checked={understood}
          onChange={setUnderstood}
          disabled={deleting}
          label="Rozumiem, że stracę wszystkie wyjazdy i historię cen"
        />
      </Dialog>
    </Page>
  )
}
