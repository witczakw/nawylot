import { daysBetween } from './dates'

export interface StayWindow {
  checkIn: string
  checkOut: string
  nights: number
}

// Nocleg od dnia przylotu (czas lokalny na miejscu) do dnia wylotu powrotnego.
// Nocny lot (wylot 23:50, przylot 01:40) zaczyna nocleg od dnia przylotu, nie wylotu.
// Gdy szczegółów lotu powrotnego nie ma, dniem wymeldowania jest data powrotu z zapytania.
export function stayWindow(
  outboundArrivesAt: string,
  returnDate: string,
  inboundDepartsAt: string | null,
): StayWindow | null {
  const checkIn = outboundArrivesAt.slice(0, 10)
  const checkOut = inboundDepartsAt?.slice(0, 10) ?? returnDate
  const nights = daysBetween(checkIn, checkOut)
  return nights >= 1 ? { checkIn, checkOut, nights } : null
}
