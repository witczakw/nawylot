import type { Money } from '@nawylot/core'

// Kształt domenowy, wspólny dla wszystkich źródeł. Adapter mapuje odpowiedź API na te typy
// i nie przepuszcza dalej pól, których nie ma w dokumentacji providera.

export interface FlightSearch {
  // Kody IATA.
  origin: string
  // null = „dowolnie”; adapter bez takiej możliwości rzuca błąd.
  destination: string | null
  // Daty 'YYYY-MM-DD', lot w obie strony.
  outboundDate: string
  returnDate: string
  adults: number
  // ISO 4217 — waluta, w której provider ma zwrócić ceny.
  currency: string
}

export interface FlightLeg {
  from: string
  to: string
  // Czas lokalny lotniska 'YYYY-MM-DDTHH:mm'.
  departsAt: string
  arrivesAt: string
  stops: number
  carriers: string[]
}

export interface FlightOffer {
  provider: string
  origin: string
  destination: string
  outboundDate: string
  returnDate: string
  outbound: FlightLeg
  // Część wyszukiwarek podaje szczegóły lotu powrotnego dopiero w kolejnym zapytaniu.
  inbound: FlightLeg | null
  // Lot w obie strony dla jednej osoby.
  pricePerPerson: Money
  // Link do zakupu wyłącznie tego lotu (CLAUDE.md, zasada 2).
  deepLink: string
  fetchedAt: Date
}

export interface FlightProvider {
  readonly id: string
  searchFlights(search: FlightSearch): Promise<FlightOffer[]>
}

export interface StaySearch {
  // Kod IATA lotniska docelowego; adapter wie, jak zamienić go na miejsce noclegu.
  destination: string
  checkIn: string
  checkOut: string
  adults: number
  currency: string
}

export interface StayOffer {
  provider: string
  name: string
  checkIn: string
  checkOut: string
  // Cena za jedną noc dla całej grupy.
  pricePerNight: Money
  // Link do rezerwacji wyłącznie tego noclegu (CLAUDE.md, zasada 2).
  deepLink: string
  fetchedAt: Date
}

export interface StayProvider {
  readonly id: string
  searchStays(search: StaySearch): Promise<StayOffer[]>
}
