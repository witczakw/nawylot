# Design — kierunek wizualny

## Koncept: „tablica odlotów”
Język wizualny bierzemy z miejsc, które każdy kojarzy z wyjazdem: lotniskowe
oznakowanie (żółte na granatowym), tablice odlotów, karta pokładowa.
Nie „pastelowe wakacje z palmami”, tylko **pewność i sygnał: to jest ten moment, żeby lecieć**.

Jeden element jest głośny — **karta okazji w stylu wiersza tablicy odlotów**, z kosztem
całkowitym jako najważniejszą liczbą na ekranie. Cała reszta jest spokojna i oszczędna.

## Kolory

| Token | Hex | Rola | Dlaczego |
|---|---|---|---|
| `horyzont` | `#EEF3F7` | tło aplikacji | chłodna biel nieba, nie kremowa |
| `chmura` | `#FFFFFF` | powierzchnie (karty, formularze) | |
| `ink` | `#13233F` | tekst, tło karty okazji | głęboki granat nocnego nieba zamiast czerni |
| `mgla` | `#5B6B82` | tekst drugorzędny | |
| `kobalt` | `#1F3FA6` | akcje, linki, fokus | niebieski = zaufanie; tu chodzi o pieniądze użytkownika |
| `sygnal` | `#F5B700` | **tylko okazje i najważniejsza akcja** | żółty lotniskowego oznakowania — kolor „zobacz to teraz” |
| `morze` | `#0B7A75` | stan „mieści się w budżecie” | morska zieleń: spokój, OK |
| `koral` | `#B53A28` | „ponad budżet”, błędy | |

Motyw ciemny „lot nocny”: tło `#0E1A30`, panele `#16264A`, tekst `#E6EDF5`,
`sygnal` bez zmian, `kobalt` → `#8FA8F0`, `morze` → `#3FB8AF`, `koral` → `#F07A6A`,
`mgla` → `#9AA9BF`.

### Kontrast (WCAG, sprawdzone)
- `ink` na `horyzont` 14:1, `sygnal` na `ink` 8.7:1, `kobalt` na `horyzont` 8.1:1
- `morze`, `koral`, `mgla` na `horyzont` ≥ 4.6:1
- **`sygnal` na jasnym tle ma 1.6:1 — NIGDY jako kolor tekstu na jasnym tle.**
  Na jasnym tle żółty jest tylko wypełnieniem, a tekst na nim ma kolor `ink`.

### O „psychologii kolorów” — uczciwie
Badania nad kolorami i emocjami są słabe i zależne od kultury. Działają za to **skojarzenia
z konkretnymi miejscami**: żółte tablice lotniskowe, granat nocnego lotu, kolor morza.
Dlatego paleta jest oparta na nich, a nie na tabelce „niebieski = spokój”.
Najważniejsza zasada: `sygnal` musi być rzadki, inaczej przestaje sygnalizować.

## Typografia
- **Overpass** (Google Fonts) — jedna rodzina na wszystko. Wywodzi się z kroju oznakowania
  drogowego (Highway Gothic), więc brzmi jak „drogowskaz”, a nie jak domyślny SaaS.
- Ceny, godziny, kody lotnisk: `font-variant-numeric: tabular-nums` — cyfry w kolumnach się nie „skaczą”.
- Skala (rem): 0.875 / 1 / 1.25 / 1.563 / 1.953 / 2.441 / 3.052. Tekst ciągły max ~70 znaków w linii.
- Kody lotnisk (POZ → BCN) wersalikami, bo tak się je zapisuje. Poza tym **żadnych etykiet w caps lock**.

## Karta okazji (element-sygnatura)
```
┌──────────────────────────────────────────────────────────┐  tło: ink
│ POZ  ───────▶  BCN          pt 17.10 – nd 19.10  · 2 noce│  tekst: horyzont
│                                                          │
│ 1 186 zł / os.                          [ Zobacz lot ]   │  kwota: sygnal, duża
│ lot 412 zł + nocleg 774 zł · 314 zł poniżej budżetu      │  „poniżej budżetu”: morze (jasny)
│ Cena z 29.09, 21:40 · może się zmienić                   │  mgla
└──────────────────────────────────────────────────────────┘
```
- Kwota całkowita to najważniejszy tekst na ekranie. Rozbicie kosztu zawsze pod spodem.
- Data pobrania ceny zawsze widoczna (zasada z CLAUDE.md).

## Ruch
- Jedyna „efektowna” animacja: przewrócenie cyfr (jak tablica split-flap), **tylko gdy cena
  faktycznie się zmieniła** od ostatniego wejścia. Nigdzie indziej.
- Poza tym ruch tylko w odpowiedzi na akcję (rozwinięcie, zapis). Szanuj `prefers-reduced-motion`.

## Layout
- Wyrównanie do lewej. Kolumna treści max ~720 px na desktopie.
- Lista okazji to lista, nie siatka identycznych kafli.
- Promienie: 4 px dla pól i przycisków, 12 px dla karty okazji. Nie wszystko ma ten sam radius.
- Cienie: brak domyślnego cienia pod wszystkim. Hierarchię buduje kolor tła, nie cień.
