import { describe, expect, it } from 'vitest'
import { stayWindow } from './stayWindow'

describe('stayWindow', () => {
  it('lot w piątek rano, powrót w niedzielę: 2 noce od piątku', () => {
    expect(stayWindow('2026-10-16T09:00', '2026-10-18', '2026-10-18T19:40')).toEqual({
      checkIn: '2026-10-16',
      checkOut: '2026-10-18',
      nights: 2,
    })
  })

  it('lot 23:50 w czwartek z przylotem 01:40 w piątek: nocleg od piątku', () => {
    expect(stayWindow('2026-10-16T01:40', '2026-10-18', null)).toEqual({
      checkIn: '2026-10-16',
      checkOut: '2026-10-18',
      nights: 2,
    })
  })

  it('bez szczegółów lotu powrotnego wymeldowanie w dniu powrotu z zapytania', () => {
    expect(stayWindow('2026-10-17T09:00', '2026-10-20', null)?.checkOut).toBe('2026-10-20')
  })

  it('powrót nocnym lotem po północy: wymeldowanie w dniu wylotu powrotnego', () => {
    expect(stayWindow('2026-10-17T09:00', '2026-10-19', '2026-10-20T00:15')).toEqual({
      checkIn: '2026-10-17',
      checkOut: '2026-10-20',
      nights: 3,
    })
  })

  it('zwraca null, gdy po przylocie nie zostaje żadna noc', () => {
    expect(stayWindow('2026-10-19T01:40', '2026-10-19', null)).toBeNull()
  })
})
