# Plan zadań (bierz od góry, odhaczaj po zrobieniu)

## M0 — szkielet
- [x] pnpm workspace, tsconfig bazowy (strict), eslint, prettier, vitest
- [x] docker-compose z Postgresem, `packages/db` z Drizzle + pierwsza migracja (tabele z ARCHITECTURE.md)
- [x] `apps/worker` z pg-boss: job `heartbeat` co minutę, logowanie
- [x] CI (GitHub Actions): typecheck + test + lint

## M1 — rdzeń domeny (bez sieci)
- [x] `core/money.ts` — typ Money (minor units + waluta), dodawanie, porównania, testy
- [x] `core/totalCost.ts` — lot × pax + nocleg × noce + szacunek bagażu, testy
- [x] `core/scoreDeal.ts` — score względem mediany z price_history (brak historii → neutralny), testy
- [x] `core/expandWatch.ts` — rozwinięcie watcha w listę zapytań (daty × długości × lotniska) z limitem, testy
- [x] `core/limits.ts` — budżet zapytań na watch/dzień

## M2 — pierwszy provider
- [ ] interfejsy w `providers/src/types.ts`
- [ ] adapter SerpAPI Google Flights + fixture'y JSON do testów (bez sieci w testach)
- [ ] cache odpowiedzi (tabela lub in-memory TTL 6h)
- [ ] adapter SerpAPI Google Hotels

## M3 — pętla end-to-end
- [ ] job `scan-watch`: expand → flights → top-N → stays → totalCost → score → zapis
- [ ] zapis price_history
- [ ] `packages/notifications`: interfejs kanału + TelegramChannel
- [ ] job `notify`: dispatch po preferencjach użytkownika, quiet hours, deduplikacja przez alerts_sent
- [ ] seed: 3 przykładowe watche (POZ → dowolnie, październik, 2–3 noce, 1000 zł/os)

## M4 — web
- [ ] podpiąć `src/styles/tokens.css`, Tailwind v4, font Overpass; strona `/design` z próbkami kolorów i kartą okazji
- [ ] formularz tworzenia watcha
- [ ] połączenie konta z Telegramem (deep link /start z tokenem)
- [ ] lista aktywnych watchy i ostatnich okazji

## M4.5 — płatności (Stripe, tryb testowy)
- [ ] tabele z docs/BILLING.md + migracja
- [ ] `packages/billing`: tworzenie klienta, Checkout (pass + abonament), Customer Portal
- [ ] `/api/billing/webhook`: podpis, idempotencja, obsługa eventów z BILLING.md, testy na nagranych eventach
- [ ] `core/entitlements.ts`: wyliczanie planu z passów i abonamentów (+ testy: nakładanie się passa i abonamentu, okres łaski)
- [ ] worker respektuje `scan_interval_minutes` i `max_watches` z entitlements
- [ ] strona `/cennik` i `/konto` (aktualny plan, do kiedy, przycisk „Zarządzaj płatnościami”)
- [ ] checkbox zgody na natychmiastowe rozpoczęcie usługi (prawo odstąpienia)
- [ ] przypomnienie 5 dni przed końcem passa

## M5 — walidacja
- [ ] wdrożenie (Vercel + worker na Railway/Fly + Neon/Supabase)
- [ ] 10–30 testerów, zbieranie metryk z PRD
- [ ] test cen: czy testerzy kupują pass za 19 zł (tryb live dopiero po ustaleniu podmiotu i regulaminu)

## Później (nie teraz)
- [ ] Web Push (PWA) jako kolejny kanał
- [ ] aplikacja mobilna (Expo) korzystająca z tych samych `core`/`db` i API
