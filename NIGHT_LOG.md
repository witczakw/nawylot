# NIGHT_LOG — nocna zmiana (gałąź `nocna-zmiana`)

Sesja autonomiczna, start 2026-09-29. Zakres: docs/TASKS.md, etapy M0–M3.

## Środowisko
- Node 22.22 (CLAUDE.md wymaga Node 20+, więc wersje narzędzi dobieram tak, żeby działały na 20),
  pnpm 9.12.0.
- Postgres 16 lokalnie (`service postgresql start`), bez Dockera. Użytkownik i baza `nawylot`,
  hasło `nawylot`. Do testów integracyjnych osobna baza `nawylot_test`
  (`TEST_DATABASE_URL=postgres://nawylot:nawylot@localhost:5432/nawylot_test`).
- Brak kluczy API (SerpAPI, Telegram, Stripe) — integracje testowane wyłącznie na fixture'ach.

---

## M0.1 — pnpm workspace, tsconfig bazowy (strict), eslint, prettier, vitest

**Plan**
- `package.json` (root): devDependencies z narzędziami, skrypty `format` / `format:check`.
- `tsconfig.base.json`: strict + `noUncheckedIndexedAccess`, `moduleResolution: Bundler`
  (pakiety wewnętrzne eksportują źródła TS, uruchamiane przez tsx/vitest, bez kroku build).
- `eslint.config.mjs` (flat config, typescript-eslint `strict`, `no-console`),
  `.prettierrc.json`, `.prettierignore`.
- Każdy pakiet dostaje własne skrypty `test` / `typecheck` / `lint`; root woła je przez `pnpm -r`.
- Testy: sprawdzenie na tymczasowym pakiecie (bez commitu), bo realny kod pojawia się od M0.2.

**Zrobione**
- Root: TypeScript 5.9, ESLint 10 + typescript-eslint 8 (`strict`, `no-console: error` — logger
  zamiast console), Prettier 3 (bez średników, pojedyncze cudzysłowy, 100 znaków), Vitest 4.
- Zweryfikowane na tymczasowym pakiecie (usunięty przed commitem): `pnpm test`,
  `pnpm typecheck`, `pnpm lint` (łapie `any` i `console.log`), `pnpm format:check`.

**Decyzje**
- Wersje zgodne z Node 20 (wymóg z CLAUDE.md): Vitest 4 zamiast 5 (5 wymaga Node ≥ 22.12),
  TypeScript 5.9 zamiast 7 (typescript-eslint obsługuje TS < 6.1).
- Pakiety wewnętrzne bez kroku build: `exports` wskazuje na `src/*.ts`, typy przez
  `moduleResolution: Bundler`. Worker uruchamiany przez tsx, web przez `transpilePackages`.
- Prettier pomija `*.md` i `.claude/` (nie wolno automatycznie przepisywać CLAUDE.md i docs)
  oraz `tokens.css` (hexy wersalikami jak w DESIGN.md). Dwa pliki YAML sformatowane (cudzysłowy).

**Do sprawdzenia ręcznie**
- Node 20 ma EOL od 30.04.2026. Jeśli zespół przejdzie na Node 22, można podbić Vitest do 5
  i pg-boss do 12.

---

## M0.2 — docker-compose z Postgresem, `packages/db` z Drizzle + pierwsza migracja

**Plan**
- `docker-compose.yml` już istnieje (Postgres 16) — bez zmian.
- `packages/db`: `src/schema.ts` (users, notification_prefs, telegram_links, watches, offers,
  price_history, alerts_sent), `src/client.ts` (połączenie node-postgres), `drizzle.config.ts`,
  migracja SQL wygenerowana przez `drizzle-kit generate` do `packages/db/drizzle/`.
- Test integracyjny: migracje na `TEST_DATABASE_URL` + zapis/odczyt watcha, sprawdzenie
  ograniczeń (np. `nights_min <= nights_max`). Bez `TEST_DATABASE_URL` test jest pomijany.

**Zrobione**
- `packages/db`: schemat 7 tabel z ARCHITECTURE.md, migracja `drizzle/0000_init.sql`
  (`pnpm db:generate` / `pnpm db:migrate` przez drizzle-kit), `createDb`, `runMigrations`.
- `@nawylot/db/testing`: `connectTestDb()` — łączy z `TEST_DATABASE_URL` i puszcza migracje pod
  blokadą doradczą (pakiety testują się równolegle).
- Testy (4, na prawdziwym Postgresie): watch „dowolnie” (`destinations = null`), daty jako
  `YYYY-MM-DD`, CHECK-i, kaskadowe usuwanie. `pnpm db:migrate` sprawdzone na bazie `nawylot`.

**Decyzje**
- `watches.budget_minor` = budżet **na osobę** (PRD: „budżet całkowity (lot + nocleg) na osobę”).
- `offers.total_minor` = koszt całego wyjazdu dla wszystkich `pax` (zgodnie z `totalCost`:
  lot × pax + nocleg). Kwota na osobę liczona na wyjściu.
- Dodane kolumny `currency char(3)` przy każdej kwocie (konwencja z CLAUDE.md), `created_at`
  w users/watches, `users.timezone` (IANA, domyślnie `Europe/Warsaw`) — potrzebne do quiet hours.
- `deep_links` typowane jako `{ flight, stay }` — dwa osobne linki (zasada 2).
- Kanały jako enum Postgresa `notification_channel` (expo/telegram/email/webpush jak w ARCHITECTURE.md).
- `quiet_hours_from/to` jako `time` w strefie użytkownika; `telegram_links.chat_id` jako bigint.
- Tabel billingowych (M4.5) celowo nie ma.
- drizzle.config.ts wczytuje `../../.env` tylko wtedy, gdy `DATABASE_URL` nie jest ustawiony.

**Do sprawdzenia ręcznie**
- Czy `users` ma już mieć e-mail / dane logowania — nie ma tego w szkicu, więc nie dodawałem.
- Czy PRD-owe „preferowane dni (pt–nd)” i „minimalny standard noclegu” mają trafić do `watches`
  (szkic w ARCHITECTURE.md ich nie ma).

---

## M0.3 — `apps/worker` z pg-boss: job `heartbeat` co minutę, logowanie

**Plan**
- `apps/worker/src/main.ts` — start pg-boss, rejestracja jobów, łagodne zatrzymanie (SIGINT/SIGTERM).
- `src/jobs/heartbeat.ts` — kolejka `heartbeat`, cron `* * * * *`, handler loguje id joba.
- `src/logger.ts` — logger JSON (jedna linia na wpis), bo ANTI_SLOP zakazuje `console.log`.
- Testy: logger (jednostkowe), heartbeat na prawdziwym pg-boss (`TEST_DATABASE_URL`, schemat `pgboss_test`).

**Zrobione**
- Worker jak w planie; `pnpm dev` (tsx watch) i `pnpm --filter @nawylot/worker start`.
- Sprawdzone ręcznie na bazie `nawylot`: `worker started` → po minucie `heartbeat` z crona
  → SIGTERM → `worker stopping` / `worker stopped`.
- Testy: 3 jednostkowe loggera + 2 integracyjne (harmonogram co minutę, przetworzenie joba).

**Decyzje**
- pg-boss 10 (gałąź maint-v10), bo pg-boss 11+ wymaga Node ≥ 22, a CLAUDE.md mówi Node 20+.
  API v10: `createQueue` przed `schedule`/`work`, handler dostaje tablicę jobów.
- Własny logger (~20 linii) zamiast pino — ANTI_SLOP: bez zależności do rzeczy na kilka linijek.
  Pola `time`/`level`/`msg` nie mogą zostać nadpisane przez przekazane pola; `Error` jest serializowany.
- Worker wczytuje `.env` z katalogu głównego tylko, gdy `DATABASE_URL` nie jest ustawiony.

**Do sprawdzenia ręcznie**
- `pnpm dev` z katalogu głównego (web jeszcze nie istnieje, więc startuje tylko worker).

---

## M0.4 — CI (GitHub Actions): typecheck + test + lint

**Plan**
- `.github/workflows/ci.yml`: push na main + pull_request; Postgres 16 jako service,
  `TEST_DATABASE_URL`, żeby testy integracyjne nie były w CI pomijane.
- Kroki: `pnpm install --frozen-lockfile`, `typecheck`, `lint`, `format:check`, `test`.

**Zrobione**
- Workflow jak w planie. Wersje akcji z README oficjalnych repozytoriów:
  `actions/checkout@v6`, `pnpm/action-setup@v6` (wersja pnpm z `packageManager`),
  `actions/setup-node@v7` z `cache: pnpm`.
- Node 20 w CI (minimum z CLAUDE.md). Lokalnie przepuściłem test/typecheck/lint na Node 20.20
  (`npx -p node@20`) — przechodzi.

**Decyzje**
- Dodatkowo `format:check`, żeby formatowanie nie rozjeżdżało się między osobami.
- CI nie odpala się na push do innych gałęzi niż main (żeby nie dublować z pull_request).

**Do sprawdzenia ręcznie**
- Pierwsze uruchomienie workflow na GitHubie — lokalnie nie da się go wykonać. Ruszy po
  otwarciu PR z `nocna-zmiana`.

---

## M1.1 — `core/money.ts`: typ Money, dodawanie, porównania

**Plan**
- `packages/core` (bez zależności, bez I/O): `package.json`, `tsconfig.json`, `src/index.ts`.
- `src/money.ts`: `Money { amountMinor, currency }`, `money()` z walidacją (integer, ISO 4217),
  `add`, `subtract`, `multiply` (przez liczbę całkowitą: osoby, noce), `compare`.
  Operacje na różnych walutach rzucają błąd — nigdy nie przeliczamy po cichu.
- `src/money.test.ts`: realne kwoty (412 zł + 774 zł), grosze, różne waluty, float jako kwota.

**Zrobione**
- `packages/core` + `money.ts` jak w planie, 13 testów.

**Decyzje**
- Kwoty ujemne dozwolone (różnica względem budżetu), ale zawsze całkowite i „bezpieczne” (`Number.isSafeInteger`).
- Brak przeliczania walut — mieszanie walut to błąd programisty, nie przypadek do obsłużenia.

---

## M1.2 — `core/totalCost.ts`: lot × pax + nocleg × noce + szacunek bagażu

**Plan**
- `totalCost({ flightPerPerson, pax, stayPerNight, nights, baggagePerPerson })` →
  rozbicie `{ flight, stay, baggage, total, perPerson }` (karta okazji pokazuje rozbicie pod kwotą).
- Testy: 1 os. / 2 os., bagaż 0 zł, kwota na osobę przy nieparzystej sumie, walidacja pax/nocy, waluty.

**Zrobione**
- `totalCost` jak w planie, 5 testów (w tym 3 osoby i nieparzysta suma).

**Decyzje**
- Bagaż liczony **na osobę** (× pax) — każdy pasażer płaci za swój bagaż. W TASKS.md wzór
  nie mówi tego wprost.
- `stayPerNight` to cena za noc dla całej grupy (nie na osobę), zgodnie ze wzorem „nocleg × noce”.
- `perPerson` zaokrąglane w górę do grosza (tylko do wyświetlania; decyzje budżetowe
  porównują sumy bez dzielenia).

**Do sprawdzenia ręcznie**
- Czy bagaż ma być na osobę, czy jeden szacunek na cały wyjazd.

---

## M1.3 — `core/scoreDeal.ts`: score względem mediany z price_history

**Plan**
- `scoreDeal(price, history)` → liczba całkowita: o ile procent cena jest niższa od mediany
  historii trasy (20 = 20% taniej niż zwykle, ujemna = drożej). Brak historii → `NEUTRAL_SCORE = 0`.
- Za mała próbka (< `MIN_HISTORY_SAMPLES`) też daje wynik neutralny — mediana z 1–2 cen nic nie mówi.
- Testy: brak historii, mała próbka, cena = mediana, 20% taniej, drożej, parzysta liczba próbek,
  nieposortowana historia, inna waluta.

**Zrobione**
- `scoreDeal` jak w planie, 10 testów. `assertSameCurrency` wyeksportowane z `money.ts`.

**Decyzje**
- Score jako całkowity procent poniżej mediany (kolumna `offers.score` to integer).
- `MIN_HISTORY_SAMPLES = 5` — poniżej tej liczby cen wynik neutralny.

**Do sprawdzenia ręcznie**
- Próg score dla alertu (PRD: „score > próg”) — przy braku historii score = 0, więc próg > 0
  zablokowałby alerty dla nowych tras. Ustawiam go dopiero w M3 i opisuję tam.

---

## M1.4 — `core/expandWatch.ts`: rozwinięcie watcha w listę zapytań z limitem

**Plan**
- `src/dates.ts`: daty kalendarzowe `YYYY-MM-DD` (jak kolumny `date`), `addDays`, `daysBetween`,
  arytmetyka w UTC (zmiana czasu 25.10 nie przesuwa dat).
- `src/expandWatch.ts`: `expandWatch(watch, { today, limit, scanIndex })` →
  `{ queries, total }`. Kombinacje: data wylotu × liczba nocy × lotnisko wylotu × cel
  (`null` = dowolnie); powrót nie później niż `dateTo`, wylot nie wcześniej niż `today`.
- Limit: kolejne skany (`scanIndex`) biorą kolejne okna listy z zawinięciem, żeby przy małym
  budżecie po kilku skanach pokryć całe okno dat, a nie w kółko pierwsze dni.
- Testy: październik 2–3 noce (57 zapytań), daty w przeszłości, okno krótsze niż noce,
  wiele lotnisk, rotacja i zawinięcie, przełom miesiąca, zmiana czasu, rok przestępny.

**Zrobione**
- `dates.ts` (6 testów) i `expandWatch.ts` (10 testów) jak w planie.

**Decyzje**
- Zakres dat watcha obejmuje cały wyjazd: wylot ≥ `dateFrom` i ≥ `today`, powrót ≤ `dateTo`.
- Kolejność zapytań: data wylotu → liczba nocy → lotnisko wylotu → cel (deterministyczna,
  potrzebna do rotacji między skanami).
- Rotacja zamiast losowania, bo `core` jest czyste i deterministyczne; worker poda `scanIndex`.
- Jedno zapytanie = jedno lotnisko wylotu i jeden cel. Łączenie lotnisk w jednym zapytaniu
  (mniej zapytań) do rozważenia, gdy będzie potwierdzone w dokumentacji providera.
- Preferowane dni tygodnia z PRD pominięte (nie ma ich w schemacie `watches`).

---

## M1.5 — `core/limits.ts`: budżet zapytań na watch/dzień

**Plan**
- `DAILY_QUERY_BUDGET_PER_WATCH`, `MAX_STAY_QUERIES_PER_SCAN` (top-N lotów, dla których szukamy
  noclegu), `DEFAULT_SCAN_INTERVAL_MINUTES` (plan „Na próbę”: co 24 h z BILLING.md).
- `scanBudget(interval, dailyBudget)` → `{ flightQueries, stayQueries }` na jeden skan, tak żeby
  skany × zapytania na skan ≤ budżet dzienny.
- `isScanDue(lastScannedAt, now, interval)` — dobowy budżet trzyma się dzięki
  `watches.last_scanned_at` (bez dodatkowej tabeli liczników).
- `scanIndex(now, interval)` — numer skanu dla rotacji w `expandWatch`.
- Testy: co 24 h / 3 h / 5 h, za mały budżet, suma na dobę ≤ budżet, due/not due, kolejne indeksy.

**Zrobione**
- `limits.ts` jak w planie, 12 testów.

**Decyzje**
- `DAILY_QUERY_BUDGET_PER_WATCH = 24`, `MAX_STAY_QUERIES_PER_SCAN = 3` — wartości robocze.
  Przy planie „Na próbę” (co 24 h) daje to 21 zapytań o loty + 3 o noclegi na skan; październik
  2–3 noce (57 kombinacji) jest pokryty w 3 dni dzięki rotacji z `expandWatch`.
- Budżet egzekwowany przez interwał skanów + `last_scanned_at`, nie przez licznik w bazie.
- Zbyt mały budżet na dany interwał to błąd (`RangeError`), a nie cichy skan bez noclegów.

**Do sprawdzenia ręcznie**
- **Do decyzji zespołu:** wartość budżetu dziennego. Wzór z BILLING.md:
  `koszt_watcha_mies = zapytania_na_skan × skany_na_dobę × 30 × koszt_zapytania`; przy 24
  zapytaniach/dobę to 720 zapytań/mies. na watch. Cennika SerpAPI nie mogłem sprawdzić
  (serpapi.com zablokowane w tej sesji).

---

## M2.1 — interfejsy w `providers/src/types.ts`

**Plan**
- `packages/providers` zależne tylko od `@nawylot/core` (typ `Money`).
- `FlightProvider.searchFlights(FlightSearch) → FlightOffer[]`,
  `StayProvider.searchStays(StaySearch) → StayOffer[]`.
- Kształt własny (domenowy), niezależny od providera; adaptery mapują odpowiedź API na te typy.
  Każda oferta ma `fetchedAt` (zasada 3: data pobrania ceny) i własny `deepLink` (zasada 2).
- Testy: same typy, bez logiki — sprawdza je `pnpm typecheck`.

**Zrobione**
- `packages/providers/src/types.ts` jak w planie; typecheck przechodzi. Pakiet ma
  `vitest run --passWithNoTests`, dopóki nie ma w nim logiki.

**Decyzje**
- Cena lotu zawsze **na osobę** (`pricePerPerson`) — to wejście `totalCost`. Jak adapter do niej
  dochodzi (np. zapytanie dla 1 dorosłego albo dzielenie), zależy od dokumentacji providera.
- `inbound` może być `null`: z tego, co wiem o Google Flights, szczegóły lotu powrotnego
  wymagają osobnego zapytania — niepotwierdzone w dokumentacji, więc interfejs dopuszcza oba warianty.
- Noclegi szukane po kodzie IATA celu; zamiana na miasto/obszar to sprawa adaptera.
- Błędy providerów: adapter rzuca wyjątek, a ponowienia z backoffem robi pg-boss
  (`retryLimit`/`retryBackoff` przy jobie) — bez własnej warstwy retry.
