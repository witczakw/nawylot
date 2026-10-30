import type { IconName } from '../components/Icon'

/* Dane podglądowe. Prawdziwe ceny przyjdą z API (packages/providers przez worker). */

export interface Airport {
  code: string
  city: string
  /** Dopełniacz: „z Poznania”. */
  from: string
}

export const airports: Airport[] = [
  { code: 'POZ', city: 'Poznań', from: 'Poznania' },
  { code: 'BER', city: 'Berlin', from: 'Berlina' },
  { code: 'WRO', city: 'Wrocław', from: 'Wrocławia' },
  { code: 'WAW', city: 'Warszawa', from: 'Warszawy' },
  { code: 'KTW', city: 'Katowice', from: 'Katowic' },
  { code: 'KRK', city: 'Kraków', from: 'Krakowa' },
  { code: 'GDN', city: 'Gdańsk', from: 'Gdańska' },
]

export const months = [
  { value: '2026-11', label: 'listopad' },
  { value: '2026-12', label: 'grudzień' },
  { value: '2027-01', label: 'styczeń' },
  { value: '2027-02', label: 'luty' },
  { value: '2027-03', label: 'marzec' },
  { value: '2027-04', label: 'kwiecień' },
  { value: '2027-05', label: 'maj' },
  { value: '2027-06', label: 'czerwiec' },
]

export const nightOptions = [2, 3, 4, 5, 7, 10, 14]

export const user = {
  name: 'Marta',
  email: 'marta.kowalczyk@przyklad.pl',
  phone: '+48 601 234 567',
}

export const lastCheck = '14:20'

export interface CostLine {
  label: string
  amount: number
}

export interface Deal {
  id: string
  place: string
  region: string
  from: string
  to: string
  dates: string
  shortDates: string
  nights: number
  people: number
  budget: number
  perPerson: number
  checkedAt: string
  breakdown: CostLine[]
  included: Array<{ icon: IconName; title: string; detail: string }>
}

export const deals: Record<string, Deal> = {
  teneryfa: {
    id: 'teneryfa',
    place: 'Puerto de la Cruz',
    region: 'Teneryfa, Hiszpania',
    from: 'BER',
    to: 'TFS',
    dates: 'sob 13.02 do sob 20.02',
    shortDates: '13.02 do 20.02',
    nights: 7,
    people: 2,
    budget: 2500,
    perPerson: 2160,
    checkedAt: '30.10, 14:20',
    breakdown: [
      { label: 'Lot w obie strony', amount: 1020 },
      { label: 'Bagaż rejestrowany 20 kg', amount: 180 },
      { label: 'Nocleg, 7 nocy', amount: 860 },
      { label: 'Transfer z lotniska, szacunek', amount: 100 },
    ],
    included: [
      {
        icon: 'plane',
        title: 'Lot bez przesiadek',
        detail: 'BER do TFS, wylot 06:40, powrót 14:15',
      },
      {
        icon: 'luggage',
        title: 'Bagaż podręczny i rejestrowany',
        detail: '10 kg w kabinie, 20 kg w luku',
      },
      {
        icon: 'bed',
        title: 'Apartament z kuchnią',
        detail: '7 nocy, 400 m od plaży, ocena gości 8,6 na 10',
      },
      {
        icon: 'bus',
        title: 'Transfer z lotniska',
        detail: 'Autobus, około 50 minut, liczymy 100 zł',
      },
    ],
  },
  malta: {
    id: 'malta',
    place: 'Sliema',
    region: 'Malta',
    from: 'POZ',
    to: 'MLA',
    dates: 'pt 12.02 do pt 19.02',
    shortDates: '12.02 do 19.02',
    nights: 7,
    people: 2,
    budget: 2500,
    perPerson: 2290,
    checkedAt: '30.10, 14:20',
    breakdown: [
      { label: 'Lot w obie strony', amount: 940 },
      { label: 'Bagaż rejestrowany 20 kg', amount: 160 },
      { label: 'Nocleg, 7 nocy', amount: 1110 },
      { label: 'Transfer z lotniska, szacunek', amount: 80 },
    ],
    included: [
      {
        icon: 'plane',
        title: 'Lot bez przesiadek',
        detail: 'POZ do MLA, wylot 10:05, powrót 13:50',
      },
      {
        icon: 'luggage',
        title: 'Bagaż podręczny i rejestrowany',
        detail: '10 kg w kabinie, 20 kg w luku',
      },
      {
        icon: 'bed',
        title: 'Pokój z balkonem',
        detail: '7 nocy, 150 m od promenady, ocena gości 8,9 na 10',
      },
      {
        icon: 'bus',
        title: 'Transfer z lotniska',
        detail: 'Autobus, około 35 minut, liczymy 80 zł',
      },
    ],
  },
  agadir: {
    id: 'agadir',
    place: 'Agadir',
    region: 'Maroko',
    from: 'BER',
    to: 'AGA',
    dates: 'nd 21.02 do nd 28.02',
    shortDates: '21.02 do 28.02',
    nights: 7,
    people: 2,
    budget: 2500,
    perPerson: 2410,
    checkedAt: '30.10, 14:20',
    breakdown: [
      { label: 'Lot w obie strony', amount: 1290 },
      { label: 'Bagaż rejestrowany 20 kg', amount: 150 },
      { label: 'Nocleg, 7 nocy ze śniadaniem', amount: 870 },
      { label: 'Transfer z lotniska, szacunek', amount: 100 },
    ],
    included: [
      {
        icon: 'plane',
        title: 'Lot z jedną przesiadką',
        detail: 'BER do AGA, przesiadka 1 godz. 40 min',
      },
      {
        icon: 'luggage',
        title: 'Bagaż podręczny i rejestrowany',
        detail: '10 kg w kabinie, 20 kg w luku',
      },
      {
        icon: 'bed',
        title: 'Hotel ze śniadaniem',
        detail: '7 nocy, przy plaży, ocena gości 8,2 na 10',
      },
      {
        icon: 'bus',
        title: 'Transfer z lotniska',
        detail: 'Taksówka, około 30 minut, liczymy 100 zł',
      },
    ],
  },
}

export type WatchStatus = 'searching' | 'deal' | 'paused'

export interface Watch {
  id: string
  title: string
  meta: string
  budget: number
  status: WatchStatus
  prices: number[]
  historyDays: number
  dealId?: string
}

export const initialWatches: Watch[] = [
  {
    id: 'w1',
    title: 'Ciepło, 7 nocy, luty',
    meta: 'do 2 500 zł/os., z POZ lub BER, 2 osoby',
    budget: 2500,
    status: 'deal',
    prices: [2780, 2710, 2690, 2590, 2620, 2480, 2390, 2160],
    historyDays: 18,
    dealId: 'teneryfa',
  },
  {
    id: 'w2',
    title: 'Lizbona lub Porto, majówka',
    meta: 'do 1 400 zł/os., z POZ, 2 osoby',
    budget: 1400,
    status: 'searching',
    prices: [1720, 1690, 1710, 1650, 1640, 1610, 1590],
    historyDays: 21,
  },
  {
    id: 'w3',
    title: 'Narty we Włoszech, marzec',
    meta: 'do 2 200 zł/os., z WRO, 4 osoby',
    budget: 2200,
    status: 'paused',
    prices: [2650, 2600, 2580, 2610, 2550],
    historyDays: 9,
  },
]
