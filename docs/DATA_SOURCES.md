# Źródła danych (stan: wrzesień 2026 — weryfikować przed integracją)

## Loty
| Źródło | Dostęp | Do czego | Uwagi |
|---|---|---|---|
| SerpAPI / SearchAPI (Google Flights) | self-serve, płatne | wyszukiwanie cen | scraping wyników; tylko dane, bez zakupu |
| Ignav | self-serve, darmowy limit, potem pay-per-use | wyszukiwanie + linki rezerwacji | nie wystawia biletów |
| Duffel | self-serve | wyszukiwanie (i zakup — NIE w MVP) | oferty wygasają ~30 min |
| Skyscanner Travel API | tylko partnerzy z dużym ruchem | — | na razie poza zasięgiem |
| Amadeus Self-Service | **wyłączone 17.07.2026** | — | nie używać |

## Noclegi
| Źródło | Dostęp | Uwagi |
|---|---|---|
| SerpAPI (Google Hotels) | self-serve | dane cen, linki do OTA |
| Booking.com Demand API | tylko partnerzy afiliacyjni | sprawdzić, czy ktoś z zespołu ma dostęp |
| Duffel Stays | przez Duffel | model profit-share |

## Monetyzacja linkami
Afiliacja (Booking, Skyscanner/impact.com, inne) — dopiero gdy MVP ma użytkowników.
W MVP linki mogą być zwykłe.

## Zasada kosztowa
Start od JEDNEGO źródła lotów i JEDNEGO noclegów (rekomendacja: SerpAPI dla obu —
jeden klucz, jeden format). Kolejne dopiero po walidacji.
