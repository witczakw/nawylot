import { airports, months } from '../data/mock'
import { nights, people, zl } from './format'

export type Scope = 'both' | 'flight' | 'stay'

export interface Plan {
  text: string
  idea: string | null
  budget: number | null
  month: string | null
  nights: number | null
  airports: string[]
  people: number | null
  scope: Scope | null
}

export const emptyPlan: Plan = {
  text: '',
  idea: null,
  budget: null,
  month: null,
  nights: null,
  airports: [],
  people: null,
  scope: null,
}

export const examplePlan: Plan = {
  text: 'Gdzieś ciepło, 7 nocy, do 2 500 zł na osobę, z Poznania lub Berlina, w lutym, we dwoje',
  idea: 'Ciepło',
  budget: 2500,
  month: '2027-02',
  nights: 7,
  airports: ['POZ', 'BER'],
  people: 2,
  scope: 'both',
}

const monthStems: Array<[RegExp, string]> = [
  [/listopad/, '2026-11'],
  [/grud/, '2026-12'],
  [/stycz/, '2027-01'],
  [/lut/, '2027-02'],
  [/marz|marc/, '2027-03'],
  [/kwie/, '2027-04'],
  [/maj|majów/, '2027-05'],
  [/czerw/, '2027-06'],
]

const airportStems: Array<[RegExp, string]> = [
  [/pozna/, 'POZ'],
  [/berlin/, 'BER'],
  [/wrocław/, 'WRO'],
  [/warszaw/, 'WAW'],
  [/katowic/, 'KTW'],
  [/krak/, 'KRK'],
  [/gdańsk/, 'GDN'],
]

const themeStems: Array<[RegExp, string]> = [
  [/ciepł|słońc|upał/, 'Ciepło'],
  [/nart|stok/, 'Narty'],
  [/plaż|morz/, 'Plaża'],
  [/zwiedz|city break/, 'Miasto'],
]

const placeStems: Array<[RegExp, string]> = [
  [/lizbon/, 'Lizbona'],
  [/porto\b/, 'Porto'],
  [/teneryf/, 'Teneryfa'],
  [/kanar/, 'Wyspy Kanaryjskie'],
  [/malt/, 'Malta'],
  [/włosz|włoch/, 'Włochy'],
  [/hiszpan/, 'Hiszpania'],
  [/portugal/, 'Portugalia'],
  [/grecj|grek/, 'Grecja'],
  [/egipt/, 'Egipt'],
  [/maroko|marok/, 'Maroko'],
  [/cypr/, 'Cypr'],
]

export const examples = [
  {
    label: 'Ciepło w lutym',
    text: 'Gdzieś ciepło, 7 nocy w lutym, do 2 500 zł na osobę, z Poznania lub Berlina, we dwoje',
  },
  {
    label: 'Majówka w Lizbonie',
    text: 'Lizbona albo Porto na majówkę, 4 noce, do 1 400 zł na osobę, z Poznania, 2 osoby',
  },
  {
    label: 'Narty w marcu',
    text: 'Narty we Włoszech w marcu, 5 nocy, 4 osoby, do 2 200 zł na osobę, z Wrocławia',
  },
]

/** Wstępne rozpoznanie w przeglądarce, żeby chipy wypełniały się w trakcie pisania.
    Właściwe rozumienie opisu robi backend. */
export function readPlan(text: string): Partial<Plan> {
  const t = text.toLowerCase()
  const found: Partial<Plan> = {}

  const budget =
    t.match(/(\d[\d\s ]{2,6})\s*(zł|pln|zl)/) ?? t.match(/(?:max|do|budżet)\s*(\d[\d\s ]{2,6})/)
  if (budget?.[1]) {
    const n = Number(budget[1].replace(/\D/g, ''))
    if (n >= 100) found.budget = n
  }
  const n = t.match(/(\d{1,2})\s*(nocy|noce|noc|dni)/)
  if (n?.[1]) found.nights = Number(n[1])
  if (/weekend/.test(t) && !found.nights) found.nights = 2

  const month = monthStems.find(([re]) => re.test(t))
  if (month) found.month = month[1]

  const codes = airportStems.filter(([re]) => re.test(t)).map(([, c]) => c)
  if (codes.length) found.airports = codes

  const ppl = t.match(/(\d)\s*(os|osob|osób)/)
  if (ppl?.[1]) found.people = Number(ppl[1])
  else if (/we dwoje|we dwójkę|we dwóch|z partner|z żoną|z mężem/.test(t)) found.people = 2
  else if (/sam\b|sama\b|solo/.test(t)) found.people = 1

  const theme = themeStems.find(([re]) => re.test(t))?.[1]
  const places = placeStems.filter(([re]) => re.test(t)).map(([, name]) => name)
  const idea = [theme, places.join(' lub ')].filter(Boolean).join(', ')
  if (idea) found.idea = idea

  if (/tylko lot|sam lot/.test(t)) found.scope = 'flight'
  else if (/tylko nocleg|sam nocleg/.test(t)) found.scope = 'stay'

  return found
}

export const monthLabel = (v: string | null) => months.find((m) => m.value === v)?.label ?? null

export const scopeLabel: Record<Scope, string> = {
  both: 'Lot i nocleg',
  flight: 'Tylko lot',
  stay: 'Tylko nocleg',
}

export function fromAirports(codes: string[]) {
  const names = codes.map((c) => airports.find((a) => a.code === c)?.from ?? c)
  return names.length ? `z ${names.join(' lub ')}` : null
}

/** „Ciepło, 7 nocy, do 2 500 zł/os., luty, z Poznania lub Berlina” */
export function summary(p: Plan) {
  return [
    p.idea ?? 'Dowolny kierunek',
    p.nights ? nights(p.nights) : null,
    p.budget ? `do ${zl(p.budget)}/os.` : null,
    monthLabel(p.month),
    fromAirports(p.airports),
  ]
    .filter(Boolean)
    .join(', ')
}

export function details(p: Plan) {
  return [
    p.people ? people(p.people) : null,
    p.scope ? scopeLabel[p.scope].toLowerCase() : null,
    'cena za osobę z bagażem i dojazdem z lotniska',
  ]
    .filter(Boolean)
    .join(', ')
}
