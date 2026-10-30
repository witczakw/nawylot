import { useState, type ReactNode } from 'react'
import { OtpInput, Skeleton, Sparkline, StatusTag } from '../components/Bits'
import { Button, type ButtonProps } from '../components/Button'
import { Checkbox, Chip, Segmented, Switch, Tag, type Tone } from '../components/Choice'
import { DealCard } from '../components/DealCard'
import { TextArea, TextField } from '../components/Field'
import { Page, PageHead } from '../components/Layout'
import { Dialog, LayerActions, Sheet } from '../components/Overlay'
import { Select } from '../components/Select'
import { ToastView, useToast } from '../components/Toast'
import { deals, months } from '../data/mock'
import { palettes, radius, spacing, typeScale } from '../design/tokens'

function Block({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-h2">{title}</h2>
        {note && <p className="text-ui text-text-muted">{note}</p>}
      </div>
      {children}
    </section>
  )
}

function Specimen({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2">
      {children}
      <span className="text-label text-text-muted">{caption}</span>
    </div>
  )
}

const states: Array<{ caption: string; props: Partial<ButtonProps> }> = [
  { caption: 'domyślny', props: {} },
  { caption: 'hover', props: { state: 'hover' } },
  { caption: 'fokus', props: { state: 'focus' } },
  { caption: 'wciśnięty', props: { state: 'active' } },
  { caption: 'wyłączony', props: { disabled: true } },
  { caption: 'ładowanie', props: { loading: true } },
]

const variants: Array<[ButtonProps['variant'], string]> = [
  ['primary', 'Pilnuj tego wyjazdu'],
  ['secondary', 'Wstrzymaj'],
  ['ghost', 'Anuluj'],
  ['danger', 'Usuń alert'],
  ['danger-ghost', 'Usuń konto'],
]

const tones: Tone[] = ['mist', 'sun', 'sea', 'green', 'red']

export function Components() {
  const toast = useToast()
  const [checked, setChecked] = useState(true)
  const [on, setOn] = useState(true)
  const [seg, setSeg] = useState<'email' | 'whatsapp'>('email')
  const [month, setMonth] = useState<string | null>('2027-02')
  const [otp, setOtp] = useState('4829')
  const [dialog, setDialog] = useState<null | 'plain' | 'danger' | 'saving' | 'sheet'>(null)
  const close = () => setDialog(null)
  const monthOptions = months.map((m) => ({ value: m.value, label: m.label }))

  return (
    <Page className="gap-12">
      <PageHead
        title="Komponenty"
        lead="Każdy element systemu we wszystkich stanach. Wartości pochodzą z src/design/tokens.ts."
      />

      <Block
        title="Kolory"
        note="Powierzchnie to odcienie tła, struktura to linia 1 px. Mocny kolor ma tylko główny przycisk."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.keys(palettes.light)
            .filter(
              (k) =>
                !k.endsWith('-fg') &&
                !['hover', 'press', 'scrim', 'shadow-float', 'ring'].includes(k),
            )
            .map((k) => (
              <div key={k} className="flex items-center gap-3">
                <span
                  className="h-8 w-8 shrink-0 rounded-tag border border-border"
                  style={{ background: `var(--c-${k})` }}
                />
                <span className="truncate text-small">{k}</span>
              </div>
            ))}
        </div>
      </Block>

      <Block
        title="Typografia"
        note="Hanken Grotesk, jedna rodzina, siedem stopni. Ceny zawsze cyframi tabelarycznymi."
      >
        <div className="flex flex-col gap-3">
          {Object.entries(typeScale).map(([k, [size, { lineHeight, fontWeight }]]) => (
            <div key={k} className="flex items-baseline gap-4">
              <span className="w-20 shrink-0 text-label text-text-muted">
                {k} {size}
              </span>
              <span className={`text-${k} truncate`} title={`${size}/${lineHeight} ${fontWeight}`}>
                {k === 'display' || k === 'h1' ? (
                  <span className="nums">2 160 zł</span>
                ) : (
                  'Teneryfa w lutym, 7 nocy'
                )}
              </span>
            </div>
          ))}
        </div>
      </Block>

      <Block
        title="Odstępy i promienie"
        note="Skala 4 px. Promienie według roli: tag 4, przycisk i pole 8, karta 12, arkusz i dialog 16."
      >
        <div className="flex flex-wrap items-end gap-3">
          {Object.entries(spacing)
            .filter(([k]) => k !== '0' && k !== 'px')
            .map(([k, v]) => (
              <Specimen key={k} caption={v}>
                <span className="block bg-tag-sea" style={{ width: v, height: v }} />
              </Specimen>
            ))}
        </div>
        <div className="flex flex-wrap gap-4">
          {(['tag', 'control', 'card', 'sheet'] as const).map((r) => (
            <Specimen key={r} caption={`${r} ${radius[r]}`}>
              <span
                className="block h-12 w-20 border border-border-ctl bg-surface-2"
                style={{ borderRadius: radius[r] }}
              />
            </Specimen>
          ))}
        </div>
      </Block>

      <Block title="Przyciski">
        {variants.map(([variant, label]) => (
          <div key={variant} className="flex flex-wrap gap-4">
            {states.map((s) => (
              <Specimen key={s.caption} caption={`${variant}, ${s.caption}`}>
                <Button variant={variant} {...s.props}>
                  {label}
                </Button>
              </Specimen>
            ))}
          </div>
        ))}
        <div className="flex flex-wrap items-end gap-4">
          <Specimen caption="sm">
            <Button size="sm" variant="secondary">
              Wyślij ponownie
            </Button>
          </Specimen>
          <Specimen caption="md z ikoną">
            <Button icon="plus">Dodaj wyjazd</Button>
          </Specimen>
          <Specimen caption="lg">
            <Button size="lg">Zobacz ofertę</Button>
          </Specimen>
          <Specimen caption="tylko ikona">
            <Button variant="ghost" iconOnly icon="x">
              Zamknij
            </Button>
          </Specimen>
        </div>
      </Block>

      <Block
        title="Pola"
        note="Prawdziwa krawędź tylko tam, gdzie się pisze lub wybiera. Błąd pola to czerwona linia pod polem, nigdy toast."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField label="Domyślne" placeholder="marta@przyklad.pl" />
          <TextField label="Hover" placeholder="marta@przyklad.pl" state="hover" />
          <TextField label="Fokus" defaultValue="marta.kowalczyk@" state="focus" />
          <TextField
            label="Wypełnione z podpowiedzią"
            defaultValue="2500"
            suffix="zł"
            hint="Budżet na osobę, za cały wyjazd."
            className="nums"
          />
          <TextField
            label="Błąd"
            defaultValue="marta.kowalczyk"
            error="Ten adres wygląda na niepełny. Sprawdź, czy ma @ i domenę."
          />
          <TextField label="Wyłączone" defaultValue="marta.kowalczyk@przyklad.pl" disabled />
          <TextField label="Ładowanie" defaultValue="Teneryfa" loading />
          <TextField label="Rozmiar md" size="md" defaultValue="22:00" />
        </div>
        <TextArea
          label="Pole opisowe"
          rows={2}
          placeholder="Na przykład: gdzieś ciepło, 7 nocy, do 2 500 zł na osobę"
        />
      </Block>

      <Block title="Select" note="Własna lista zamiast natywnej. Strzałki, Home, End, Enter, Esc.">
        <div className="grid gap-6 sm:grid-cols-2">
          <Select label="Zamknięty" value={month} onChange={setMonth} options={monthOptions} />
          <Select
            label="Pusty"
            value={null}
            onChange={setMonth}
            options={monthOptions}
            placeholder="Wybierz miesiąc"
          />
          <Select
            label="Błąd"
            value={null}
            onChange={setMonth}
            options={monthOptions}
            error="Wybierz miesiąc wyjazdu."
          />
          <Select
            label="Wyłączony"
            value={month}
            onChange={setMonth}
            options={monthOptions}
            disabled
          />
          <div className="min-h-[340px] sm:col-span-2">
            <Select
              label="Otwarty"
              value={month}
              onChange={setMonth}
              options={monthOptions}
              defaultOpen
            />
          </div>
        </div>
      </Block>

      <Block title="Checkbox, przełącznik, segmenty">
        <div className="grid gap-4 sm:grid-cols-2">
          <Checkbox
            checked={checked}
            onChange={setChecked}
            label="Zaznaczony, klikalny"
            description="Opis pod etykietą"
          />
          <Checkbox checked={false} onChange={() => {}} label="Niezaznaczony" />
          <Checkbox checked onChange={() => {}} label="Fokus" state="focus" />
          <Checkbox checked={false} onChange={() => {}} label="Wyłączony" disabled />
        </div>
        <div className="flex flex-wrap gap-6">
          <Specimen caption="włączony, klikalny">
            <Switch label="Przykład" checked={on} onChange={setOn} />
          </Specimen>
          <Specimen caption="wyłączony">
            <Switch label="Przykład" checked={false} onChange={() => {}} />
          </Specimen>
          <Specimen caption="fokus">
            <Switch label="Przykład" checked onChange={() => {}} state="focus" />
          </Specimen>
          <Specimen caption="niedostępny">
            <Switch label="Przykład" checked onChange={() => {}} disabled />
          </Specimen>
        </div>
        <Segmented
          label="Kanał"
          value={seg}
          onChange={setSeg}
          options={[
            { value: 'email', label: 'E-mail', icon: 'mail' },
            { value: 'whatsapp', label: 'WhatsApp', icon: 'message' },
          ]}
        />
        <Segmented
          label="Wyłączony"
          value="email"
          onChange={() => {}}
          disabled
          options={[
            { value: 'email', label: 'E-mail' },
            { value: 'whatsapp', label: 'WhatsApp' },
          ]}
        />
      </Block>

      <Block
        title="Chipy i tagi"
        note="Pigułka tylko dla chipów filtra. Status zawsze ikoną i tagiem, nie samym kolorem."
      >
        <div className="flex flex-wrap gap-4">
          <Specimen caption="pusty">
            <Chip label="Budżet" />
          </Specimen>
          <Specimen caption="pusty, hover">
            <Chip label="Kiedy" state="hover" />
          </Specimen>
          <Specimen caption="wypełniony">
            <Chip label="Skąd" value="z POZ lub BER" icon="plane" />
          </Specimen>
          <Specimen caption="wypełniony, hover">
            <Chip label="Budżet" value="do 2 500 zł/os." icon="wallet" state="hover" />
          </Specimen>
          <Specimen caption="fokus">
            <Chip label="Ile osób" value="2 osoby" icon="users" state="focus" />
          </Specimen>
          <Specimen caption="wyłączony">
            <Chip label="Ile osób" disabled />
          </Specimen>
        </div>
        <div className="flex flex-wrap gap-2">
          {tones.map((t) => (
            <Tag key={t} tone={t}>
              {t}
            </Tag>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusTag status="searching" />
          <StatusTag status="deal" />
          <StatusTag status="paused" />
          <Tag tone="sun" icon="trending-down">
            o 340 zł poniżej budżetu
          </Tag>
          <Tag tone="red" icon="alert-circle">
            Ponad budżet
          </Tag>
        </div>
      </Block>

      <Block
        title="Toasty"
        note="Sukces i informacja znikają po 5 s. Błąd zostaje do zamknięcia albo ponowienia. Najwyżej trzy naraz."
      >
        <div className="flex flex-col gap-2">
          <ToastView
            toast={{
              kind: 'success',
              title: 'Pilnujemy wyjazdu',
              description: 'Pierwsze ceny sprawdzimy w ciągu godziny.',
            }}
            onDismiss={() => {}}
          />
          <ToastView
            toast={{
              kind: 'info',
              title: 'Wysłaliśmy nowy kod',
              description: 'Poprzedni kod przestał działać.',
            }}
            onDismiss={() => {}}
          />
          <ToastView
            toast={{
              kind: 'error',
              title: 'Nie udało się zapisać ustawień',
              description: 'Brak połączenia. Zmiany są tylko na tym urządzeniu.',
              action: { label: 'Spróbuj ponownie', onClick: () => {} },
            }}
            onDismiss={() => {}}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              toast({
                kind: 'success',
                title: 'Zapisaliśmy ustawienia',
                description: 'Zmiany działają od następnego sprawdzenia cen.',
              })
            }
          >
            Pokaż sukces
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast({
                kind: 'info',
                title: 'Ceny się zmieniły',
                description: 'Teneryfa jest teraz o 40 zł tańsza.',
              })
            }
          >
            Pokaż informację
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast({
                kind: 'error',
                title: 'Nie udało się pobrać cen',
                description: 'Partner nie odpowiada. Spróbujemy ponownie o 15:00.',
                action: {
                  label: 'Spróbuj teraz',
                  onClick: () =>
                    toast({
                      kind: 'success',
                      title: 'Pobraliśmy ceny',
                      description: 'Lista jest aktualna.',
                    }),
                },
              })
            }
          >
            Pokaż błąd
          </Button>
        </div>
      </Block>

      <Block
        title="Dialogi i arkusze"
        note="Płaski scrim, krawędź 1 px i jeden cień. Esc, Anuluj i kliknięcie w tło zamykają."
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setDialog('plain')}>
            Dialog z polem
          </Button>
          <Button variant="secondary" onClick={() => setDialog('danger')}>
            Dialog niszczący
          </Button>
          <Button variant="secondary" onClick={() => setDialog('saving')}>
            Dialog w trakcie zapisu
          </Button>
          <Button variant="secondary" onClick={() => setDialog('sheet')}>
            Arkusz
          </Button>
        </div>
        <Dialog
          open={dialog === 'plain'}
          onClose={close}
          title="Zmień nazwę wyjazdu"
          description="Nazwa jest tylko dla Ciebie, pojawi się w alertach."
          footer={<LayerActions onCancel={close} confirm="Zmień nazwę" onConfirm={close} />}
        >
          <TextField label="Nazwa" defaultValue="Ciepło, 7 nocy, luty" />
        </Dialog>
        <Dialog
          open={dialog === 'danger'}
          role="alertdialog"
          onClose={close}
          title="Usunąć alert?"
          description="Przestaniemy sprawdzać ceny dla „Ciepło, 7 nocy, luty” i usuniemy historię cen z 18 dni."
          footer={<LayerActions onCancel={close} confirm="Usuń alert" danger onConfirm={close} />}
        />
        <Dialog
          open={dialog === 'saving'}
          locked
          onClose={close}
          title="Zmień nazwę wyjazdu"
          description="Pola są zablokowane, dopóki zapis trwa. Zamknij przyciskiem poniżej."
          footer={
            <>
              <Button variant="ghost" onClick={close}>
                Zamknij podgląd
              </Button>
              <Button loading>Zmień nazwę</Button>
            </>
          }
        >
          <TextField label="Nazwa" defaultValue="Ciepło, 7 nocy, luty" disabled />
        </Dialog>
        <Sheet
          open={dialog === 'sheet'}
          onClose={close}
          title="Ile chcesz wydać"
          description="Budżet na jedną osobę, za cały wyjazd."
          footer={<LayerActions onCancel={close} confirm="Ustaw budżet" onConfirm={close} />}
        >
          <TextField label="Budżet na osobę" defaultValue="2500" suffix="zł" className="nums" />
        </Sheet>
      </Block>

      <Block title="Kod jednorazowy">
        <OtpInput value={otp} onChange={setOtp} />
        <OtpInput value="111111" onChange={() => {}} error />
      </Block>

      <Block
        title="Szkielety, wykres, karta okazji"
        note="Szkielety to nieruchome kształty, które spokojnie pulsują."
      >
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-12 w-full rounded-card" />
        </div>
        <div className="flex items-center gap-6">
          <Specimen caption="poniżej budżetu">
            <Sparkline prices={[2780, 2710, 2690, 2590, 2620, 2480, 2390, 2160]} budget={2500} />
          </Specimen>
          <Specimen caption="ponad budżetem">
            <Sparkline prices={[1720, 1690, 1710, 1650, 1640, 1610, 1590]} budget={1400} />
          </Specimen>
        </div>
        <DealCard deal={deals.malta!} />
      </Block>
    </Page>
  )
}
