import { describe, expect, it } from 'vitest'
import { add, compare, money, multiply, subtract } from './money'

const pln = (amountMinor: number) => money(amountMinor, 'PLN')

describe('money', () => {
  it('przyjmuje kwotę w groszach i kod waluty', () => {
    expect(money(118_600, 'PLN')).toEqual({ amountMinor: 118_600, currency: 'PLN' })
  })

  it('odrzuca kwotę z częścią ułamkową — 11.99 zł to 1199 groszy, nie 11.99', () => {
    expect(() => money(11.99, 'PLN')).toThrow(RangeError)
  })

  it('odrzuca kwoty poza bezpiecznym zakresem integerów', () => {
    expect(() => money(Number.MAX_SAFE_INTEGER + 1, 'PLN')).toThrow(RangeError)
    expect(() => money(Number.NaN, 'PLN')).toThrow(RangeError)
  })

  it('odrzuca kod waluty spoza formatu ISO 4217', () => {
    expect(() => money(100, 'zł')).toThrow(RangeError)
    expect(() => money(100, 'pln')).toThrow(RangeError)
  })

  it('dopuszcza kwotę ujemną (np. różnica względem budżetu)', () => {
    expect(money(-31_400, 'PLN').amountMinor).toBe(-31_400)
  })
})

describe('add / subtract', () => {
  it('lot 412 zł + nocleg 774 zł = 1186 zł', () => {
    expect(add(pln(41_200), pln(77_400))).toEqual(pln(118_600))
  })

  it('sumuje grosze bez błędów zaokrągleń floatów (0.10 + 0.20)', () => {
    expect(add(pln(10), pln(20))).toEqual(pln(30))
  })

  it('budżet 1500 zł − koszt 1186 zł = 314 zł zapasu', () => {
    expect(subtract(pln(150_000), pln(118_600))).toEqual(pln(31_400))
  })

  it('nie łączy kwot w różnych walutach', () => {
    expect(() => add(pln(100), money(100, 'EUR'))).toThrow(/PLN i EUR/)
    expect(() => subtract(pln(100), money(100, 'EUR'))).toThrow(/PLN i EUR/)
  })
})

describe('multiply', () => {
  it('lot 412 zł × 2 osoby = 824 zł', () => {
    expect(multiply(pln(41_200), 2)).toEqual(pln(82_400))
  })

  it('nie mnoży przez ułamek, bo wynik wyszedłby poza pełne grosze', () => {
    expect(() => multiply(pln(41_200), 1.5)).toThrow(RangeError)
  })
})

describe('compare', () => {
  it('porównuje kwoty w tej samej walucie', () => {
    expect(compare(pln(118_600), pln(150_000))).toBe(-1)
    expect(compare(pln(150_000), pln(150_000))).toBe(0)
    expect(compare(pln(150_001), pln(150_000))).toBe(1)
  })

  it('nie porównuje kwot w różnych walutach', () => {
    expect(() => compare(pln(100), money(100, 'EUR'))).toThrow(/PLN i EUR/)
  })
})
