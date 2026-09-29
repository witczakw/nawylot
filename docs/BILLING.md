# Model płatności i integracja Stripe

## Zasada nadrzędna
Stripe służy **wyłącznie do opłacania naszej usługi** (dostęp do alertów).
Nigdy nie pobieramy przez Stripe pieniędzy za loty, noclegi ani „budżet na wyjazd”
(powody: `docs/CONSTRAINTS.md`).

## Dlaczego nie sam abonament
Ludzie szukają wyjazdu w zrywach: przez 3–6 tygodni intensywnie, potem kupują i znikają.
Czysty abonament miesięczny = wysoki churn i poczucie „płacę za coś, czego nie używam”.
Dlatego główny produkt to **jednorazowy pass na czas szukania**, a abonament jest dla tych,
którzy latają często.

## Plany (propozycja — ceny do walidacji na testerach)

| Plan | Cena brutto | Typ w Stripe | Limity |
|---|---|---|---|
| **Na próbę** | 0 zł | — | 1 watch, skan co 24 h, alerty na Telegram |
| **Pass na wyjazd** | 19 zł / 30 dni | płatność jednorazowa (`mode=payment`) | 3 watche, skan co 3 h, wszystkie kanały, „dowolny kierunek” |
| **Stały bywalec** | 15 zł / mies. lub 129 zł / rok | abonament (`mode=subscription`) | 10 watchy, skan co 1 h, historia cen tras, wszystkie kanały |

- Pass **nie odnawia się sam**. Na 5 dni przed końcem przypominamy i proponujemy przedłużenie
  albo przejście na abonament.
- Kto kupił wyjazd z naszego alertu, dostaje prośbę o potwierdzenie („Kupiłem!”) — to nasza
  główna metryka i materiał do marketingu.

### Skąd limity
Główny koszt zmienny to zapytania do providerów cen. Limity planów to w praktyce
**limity częstotliwości skanowania** (`packages/core/src/limits.ts`).
Przed ustaleniem cen policzcie w arkuszu:

```
koszt_watcha_mies = zapytania_na_skan × skany_na_dobę × 30 × koszt_zapytania
marża_planu      = cena_netto − Σ koszt_watchy − opłata_Stripe
```
Cena netto = brutto / 1,23 (VAT 23%). Plan jest OK, jeśli marża > 50% przy maksymalnym wykorzystaniu limitów.

## Drugie źródło przychodu: afiliacja
Linki partnerów (loty, noclegi) z prowizją. Twarda zasada zaufania:
**kolejność i wybór okazji nigdy nie zależą od prowizji.** Scoring patrzy wyłącznie na cenę,
budżet i jakość. Jeśli link jest afiliacyjny, oznaczamy to w UI.

## Metody płatności (Stripe)
- Karta, Apple Pay, Google Pay — pass i abonament.
- **BLIK** — pass (jednorazowo) na pewno. Stripe ma już dokumentację BLIK do płatności
  cyklicznych (SetupIntent `off_session`), ale sprawdźcie, czy jest aktywne na Waszym koncie,
  zanim obiecacie „abonament przez BLIK”.
- Przelewy24 — opcjonalnie dla passa.
Wszystko przez Stripe Checkout (hostowany) — zero własnych formularzy kart.

## Architektura

```
[web] ──POST /api/billing/checkout──> Stripe Checkout ──> sukces → /konto?paid=1
                                             │
Stripe ──webhook──> /api/billing/webhook ──> packages/billing
                                             ├─ zapis stripe_events (idempotencja)
                                             ├─ aktualizacja subscriptions / passes
                                             └─ przeliczenie entitlements(user)
[worker] ── czyta entitlements ──> limity skanów i kanałów
[web] ──POST /api/billing/portal──> Stripe Customer Portal (zmiana karty, anulowanie, faktury)
```

### Tabele
- `billing_customers` (user_id, stripe_customer_id)
- `passes` (id, user_id, stripe_payment_intent_id, valid_from, valid_to, plan)
- `subscriptions` (id, user_id, stripe_subscription_id, status, price_id, current_period_end, cancel_at_period_end)
- `entitlements` (user_id, plan, max_watches, scan_interval_minutes, channels[], valid_to) — wyliczane, nie edytowane ręcznie
- `stripe_events` (event_id PK, type, received_at, processed_at) — każdy event przetwarzamy dokładnie raz

### Webhooki do obsługi
- `checkout.session.completed` — utworzenie passa lub powiązanie abonamentu
- `customer.subscription.created` / `updated` / `deleted`
- `invoice.paid`, `invoice.payment_failed` — przy nieudanej płatności okres łaski 3 dni, potem plan darmowy
- `charge.refunded` — skrócenie passa

### Zasady implementacji
- Stan płatności ustalamy **tylko z webhooków**, nigdy z parametru `?paid=1` w URL.
- Weryfikacja podpisu webhooka (`STRIPE_WEBHOOK_SECRET`), surowe body.
- Idempotencja: najpierw `INSERT` do `stripe_events`, konflikt = już przetworzone.
- Ceny i produkty tworzymy w Stripe Dashboard; w kodzie tylko `price_id` z `.env`.
- Po wygaśnięciu planu watche nie znikają — ponad limit zostają wstrzymane, użytkownik wybiera, które zostawić.
- Lokalnie: `stripe listen --forward-to localhost:3000/api/billing/webhook`, tryb testowy.

## Formalności w Polsce (do potwierdzenia z księgową / prawnikiem)
- **Podmiot**: ktoś musi być sprzedawcą (JDG jednego z Was albo spółka). Ustalcie to przed pierwszą płatnością, razem z podziałem udziałów.
- **Ceny brutto** w UI (konsument widzi cenę z VAT).
- **Prawo odstąpienia (14 dni)** przy usługach cyfrowych: w checkoutcie checkbox ze zgodą na
  rozpoczęcie świadczenia przed upływem terminu i przyjęciem do wiadomości utraty prawa odstąpienia.
  Bez tego klient może żądać zwrotu.
- **Regulamin i polityka prywatności** — wymagane przy usługach świadczonych drogą elektroniczną.
- **Kasa fiskalna / paragony** przy sprzedaży konsumentom i **faktury w KSeF** przy sprzedaży firmom — zapytajcie księgową, czy i jakie zwolnienie Was obejmuje.
