/* Wszystkie decyzje designu w jednym miejscu. Komponenty używają wyłącznie klas
   Tailwinda zbudowanych z tych wartości (tailwind.config.ts), nigdy hexów. */

type Palette = Record<string, string>

const light: Palette = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  'surface-2': '#F2F8F4',
  'surface-2-hover': '#E6F1EA',
  hover: 'rgba(15,36,28,.05)',
  press: 'rgba(15,36,28,.09)',
  border: '#E3ECE6',
  'border-ctl': '#C6D5CC',
  text: '#0F241C',
  'text-muted': '#536D62',
  accent: '#08805A',
  'accent-hover': '#066F4E',
  'accent-press': '#055F43',
  'accent-text': '#07704F',
  'accent-fg': '#FFFFFF',
  ring: 'rgba(8,128,90,.22)',
  success: '#1E7A4A',
  warning: '#8A6100',
  danger: '#B3261E',
  'danger-hover': '#9C211A',
  'danger-fg': '#FFFFFF',
  scrim: 'rgba(15,36,28,.32)',
  'shadow-float': 'rgba(15,36,28,.07)',
  'tag-mist': '#EDF3EF',
  'tag-mist-fg': '#435C52',
  'tag-sun': '#FFF2C7',
  'tag-sun-fg': '#6B5000',
  'tag-sea': '#DAF2F0',
  'tag-sea-fg': '#0D5E5B',
  'tag-green': '#DCF4E6',
  'tag-green-fg': '#0E5E3E',
  'tag-red': '#FCE4E2',
  'tag-red-fg': '#9B231C',
}

const dark: Palette = {
  bg: '#0B1511',
  surface: '#111E18',
  'surface-2': '#172820',
  'surface-2-hover': '#1E3229',
  hover: 'rgba(234,243,238,.06)',
  press: 'rgba(234,243,238,.10)',
  border: '#21352C',
  'border-ctl': '#34493F',
  text: '#EAF3EE',
  'text-muted': '#9BB3A7',
  accent: '#34C98C',
  'accent-hover': '#4DD69D',
  'accent-press': '#66DFAD',
  'accent-text': '#4DD69D',
  'accent-fg': '#06120D',
  ring: 'rgba(52,201,140,.30)',
  success: '#6BD49C',
  warning: '#F2C55C',
  danger: '#F28B82',
  'danger-hover': '#F5A29A',
  'danger-fg': '#0B1511',
  scrim: 'rgba(0,0,0,.55)',
  'shadow-float': 'rgba(0,0,0,.25)',
  'tag-mist': '#1C2B24',
  'tag-mist-fg': '#C2D3CA',
  'tag-sun': '#33301A',
  'tag-sun-fg': '#F2D06B',
  'tag-sea': '#12302E',
  'tag-sea-fg': '#6FD0CA',
  'tag-green': '#133324',
  'tag-green-fg': '#6BD49C',
  'tag-red': '#3A1F1D',
  'tag-red-fg': '#F2958A',
}

export const palettes = { light, dark }

/* Skala odstępów 4 px. Klucz = mnożnik 4 px (p-4 = 16 px), poza nią nic. */
export const spacing = {
  0: '0px',
  px: '1px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
}

/* Promienie przypisane do ról. */
export const radius = {
  none: '0px',
  tag: '4px',
  control: '8px',
  card: '12px',
  sheet: '16px',
  pill: '9999px',
}

export const fontFamily = {
  sans: ['"Hanken Grotesk"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
}

export const typeScale: Record<string, [string, { lineHeight: string; fontWeight: string }]> = {
  display: ['40px', { lineHeight: '1.15', fontWeight: '700' }],
  h1: ['30px', { lineHeight: '1.25', fontWeight: '600' }],
  h2: ['22px', { lineHeight: '1.35', fontWeight: '600' }],
  body: ['16px', { lineHeight: '1.6', fontWeight: '400' }],
  ui: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
  small: ['13px', { lineHeight: '1.5', fontWeight: '400' }],
  label: ['12px', { lineHeight: '1.35', fontWeight: '500' }],
}

/* Jedyny cień w systemie (warstwy pływające) i pierścień fokusu: 2 px akcentu + 3 px miękko. */
export const shadow = {
  none: 'none',
  float: '0 2px 6px var(--c-shadow-float)',
  focus: '0 0 0 2px var(--c-accent), 0 0 0 5px var(--c-ring)',
}

export const motion = {
  ease: 'cubic-bezier(.2,0,0,1)',
  fast: '120ms',
  base: '160ms',
  slow: '200ms',
}

export const layout = {
  content: '640px',
  mid: '880px',
  wide: '1120px',
  toast: '360px',
  dialog: '440px',
}
