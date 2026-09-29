import { describe, expect, it } from 'vitest'
import { money } from './money'
import { MIN_HISTORY_SAMPLES, NEUTRAL_SCORE, routeKey, scoreDeal } from './scoreDeal'

const pln = (zl: number) => money(zl * 100, 'PLN')
const history = (...zl: number[]) => zl.map(pln)

describe('scoreDeal', () => {
  it('bez historii trasy zwraca wynik neutralny', () => {
    expect(scoreDeal(pln(412), [])).toBe(NEUTRAL_SCORE)
  })

  it(`przy mniej niż ${MIN_HISTORY_SAMPLES} cenach w historii zwraca wynik neutralny`, () => {
    expect(scoreDeal(pln(200), history(500, 520, 480, 510))).toBe(NEUTRAL_SCORE)
  })

  it('cena równa medianie daje 0', () => {
    expect(scoreDeal(pln(500), history(450, 480, 500, 530, 900))).toBe(0)
  })

  it('lot za 400 zł przy medianie 500 zł to 20% taniej niż zwykle', () => {
    expect(scoreDeal(pln(400), history(450, 480, 500, 530, 900))).toBe(20)
  })

  it('cena powyżej mediany daje wynik ujemny', () => {
    expect(scoreDeal(pln(600), history(450, 480, 500, 530, 900))).toBe(-20)
  })

  it('jedna wyjątkowo droga cena w historii nie zawyża oceny (mediana, nie średnia)', () => {
    expect(scoreDeal(pln(500), history(490, 500, 500, 510, 5000))).toBe(0)
  })

  it('przy parzystej liczbie cen bierze średnią dwóch środkowych', () => {
    // mediana z 400, 450, 550, 600, 700, 800 = (550 + 600) / 2 = 575
    expect(scoreDeal(pln(460), history(800, 400, 600, 450, 700, 550))).toBe(20)
  })

  it('kolejność historii nie ma znaczenia', () => {
    const sorted = history(450, 480, 500, 530, 900)
    const shuffled = history(900, 500, 450, 530, 480)

    expect(scoreDeal(pln(430), shuffled)).toBe(scoreDeal(pln(430), sorted))
  })

  it('zaokrągla do pełnego procenta', () => {
    // (500 − 433) / 500 = 13,4%
    expect(scoreDeal(pln(433), history(450, 480, 500, 530, 900))).toBe(13)
  })

  it('odrzuca historię w innej walucie niż cena', () => {
    const eurHistory = [100, 110, 120, 130, 140].map((eur) => money(eur * 100, 'EUR'))

    expect(() => scoreDeal(pln(400), eurHistory)).toThrow(/PLN i EUR/)
  })
})

describe('routeKey', () => {
  it('rozróżnia kierunek trasy', () => {
    expect(routeKey('POZ', 'BCN')).toBe('POZ-BCN')
    expect(routeKey('BCN', 'POZ')).not.toBe(routeKey('POZ', 'BCN'))
  })
})
