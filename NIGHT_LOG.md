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

---

## M2.2 — adapter SerpAPI Google Flights + fixture'y JSON

BLOKADA: adapter SerpAPI Google Flights — nie mogę potwierdzić kształtu odpowiedzi API
w dokumentacji: serpapi.com (i serpapi-python.readthedocs.io) są zablokowane przez politykę
sieci tej sesji, a jedyny dostępny opis (README repo `serpapi/google-flights-scraper`, tylko
w streszczeniu) nie mówi m.in., czy `price` jest za osobę czy za wszystkich pasażerów, ani jak
działa lot powrotny (`departure_token`) i „dowolny kierunek” — potrzebuję od zespołu:
1. nagranej odpowiedzi JSON z SerpAPI (`engine=google_flights`, lot w obie strony, np.
   POZ→BCN, 1 i 2 dorosłych, `currency=PLN`) do `packages/providers/fixtures/`, albo
   dostępu do serpapi.com w kolejnej sesji;
2. decyzji, jak obsłużyć watch „dowolnie” (Google Flights wymaga `arrival_id`; SerpAPI ma
   podobno osobny silnik do eksploracji kierunków — do potwierdzenia) — seed z M3 to właśnie
   „POZ → dowolnie”.

Żaden kod adaptera nie został dodany (zgodnie z zasadą „nie zgaduj”).

---

## M2.3 — cache odpowiedzi (tabela lub in-memory TTL 6h)

**Plan**
- `packages/providers/src/cache.ts`: `TtlCache` w pamięci (TTL 6 h, zegar wstrzykiwany do
  testów), `cachedFlightProvider` / `cachedStayProvider` — opakowania na interfejsy z M2.1,
  więc działają z każdym przyszłym adapterem.
- Klucz: id providera + wszystkie pola zapytania. Równoległe zapytania o ten sam klucz czekają
  na jedno wywołanie. Błędy nie trafiają do cache.
- Testy na fałszywym providerze (licznik wywołań) i sztucznym zegarze.

**Zrobione**
- `TtlCache`, `cachedFlightProvider`, `cachedStayProvider`, 7 testów.

**Decyzje**
- In-memory zamiast tabeli: najprostsze, bez migracji; worker w MVP to jeden proces.
  Minus: restart/deploy czyści cache (pierwszy skan po deployu zapłaci pełną cenę).
- Oferta z cache zachowuje pierwotne `fetchedAt` — alert pokaże prawdziwą datę pobrania ceny.
- TTL liczony od wysłania zapytania.

**Do sprawdzenia ręcznie**
- Czy przy kilku instancjach workera (np. Railway z repliką) nie przejść na tabelę w Postgresie.

---

## M2.4 — adapter SerpAPI Google Hotels

BLOKADA: adapter SerpAPI Google Hotels — nie mogę potwierdzić kształtu odpowiedzi API
w dokumentacji (serpapi.com zablokowane przez politykę sieci tej sesji; brak innego oficjalnego
opisu pól). Niewiadome: czy cena za noc jest za pokój czy za osobę, z podatkami czy bez, jak
wygląda link do rezerwacji u OTA, jak podać miejsce (nazwa miasta zamiast kodu IATA?) —
potrzebuję od zespołu: nagranej odpowiedzi JSON (`engine=google_hotels`, np. Barcelona,
17–19.10, 1 i 2 dorosłych, `currency=PLN`) do `packages/providers/fixtures/` albo dostępu do
serpapi.com; oraz decyzji, skąd brać nazwę miejsca dla kodu IATA celu (stała tabela lotnisk?).

Żaden kod adaptera nie został dodany.

---

## M3.1 — job `scan-watch`: expand → flights → top-N → stays → totalCost → score → zapis

**Plan**
- `core`: `stayWindow` (nocleg od dnia przylotu do dnia powrotu; przypadek „lot 23:50,
  nocleg od następnego dnia”), `cheapest` / `cheapestDistinct` (top-N lotów o różnych oknach
  noclegu), `routeKey`, `HISTORY_WINDOW_DAYS`, `toIsoDate`, `BAGGAGE_ESTIMATE_PER_PERSON_MINOR`.
- `apps/worker/src/jobs/scanWatch.ts`: `scanWatch(deps, watchId)` — cała ścieżka z tytułu
  zadania, zapis ofert i `last_scanned_at` w jednej transakcji; providery wstrzykiwane
  (interfejsy z M2.1). Kolejka `scan-watch` z polityką `stately` (maks. jeden skan watcha naraz)
  i retry z backoffem pg-boss.
- `schedule-scans` (cron co 15 min): wybiera aktywne watche, którym minął interwał
  (`isScanDue`), i wrzuca `scan-watch` z `singletonKey = watchId`.
- Testy: core jednostkowo; `scanWatch` i wybór watchy na Postgresie z providerami
  podstawionymi w teście.

**Zrobione**
- core: `stayWindow` (5 testów, w tym lot 23:50 → nocleg od dnia przylotu), `cheapest` /
  `cheapestDistinct` (5), `routeKey`, `HISTORY_WINDOW_DAYS = 90`, `toIsoDate`,
  `BAGGAGE_ESTIMATE_PER_PERSON_MINOR = 0`.
- worker: `scanWatch`, `dueWatchIds`, `registerScanWatch` (kolejka `scan-watch` + cron
  `schedule-scans` co 15 min). 7 testów na Postgresie, w tym przejście przez pg-boss.
- Poprawka przy okazji: nazwy dni w dwóch testach dat (17.10.2026 to sobota, nie piątek).

**Decyzje**
- Top-N = najtańsze loty o **różnych oknach noclegu** (cel + zameldowanie + wymeldowanie),
  żeby nie pytać N razy o ten sam nocleg.
- Nocleg: najtańsza oferta providera. Minimalny standard noclegu z PRD nie istnieje jeszcze
  w schemacie watcha, więc nie filtrujemy.
- Score liczony dla ceny lotu na osobę względem mediany trasy (`price_history`: ta sama trasa,
  ta sama waluta, ostatnie 90 dni).
- `offers.fetched_at` = starsza z dat pobrania lotu i noclegu.
- Zapisujemy wszystkie oferty z top-N (także ponad budżet) — przydadzą się w UI „ostatnie
  okazje”; o alercie decyduje job `notify` (M3.4).
- Błąd providera = błąd joba; pg-boss ponawia (3 razy, backoff od 60 s). Zapytania, które się
  udały, wracają z cache (M2.3), więc ponowienie nie płaci drugi raz.
- Szacunek bagażu = 0 zł (bilet z bagażem podręcznym) — wartość do decyzji zespołu.
- `today` liczone w UTC.

**Do sprawdzenia ręcznie**
- **Job NIE jest zarejestrowany w `main.ts`** — nie ma jeszcze adapterów providerów
  (BLOKADA M2.2/M2.4). Po ich dodaniu: `registerScanWatch(boss, { db, flights:
  cachedFlightProvider(adapter), stays: cachedStayProvider(adapter), log, now: () => new Date() })`.
- Szacunek bagażu (0 zł) i czy przy watchu „dowolnie” top-N nie powinno preferować różnych miast.

---

## M3.2 — zapis price_history

**Plan**
- W `scanWatch`: z wszystkich znalezionych lotów najtańsza cena na osobę dla każdej pary
  (trasa, data wylotu) → wiersz `price_history` (`fetched_at` = data pobrania z providera).
- Zapis w tej samej transakcji co oferty, **po** policzeniu score — bieżąca cena nie wpływa
  na medianę, z którą jest porównywana.
- Migracja `0001`: unikalny indeks (route_key, date, currency, fetched_at) + `ON CONFLICT DO
  NOTHING` — ta sama obserwacja z cache (to samo `fetchedAt`) nie trafi do historii dwa razy.
- Testy: jeden wiersz na trasę/datę z najniższą ceną, ponowny skan z cache bez duplikatu,
  score nadal bez bieżącej ceny.

**Zrobione**
- Zapis `price_history` w `scanWatch` jak w planie, migracja
  `0001_price_history_observation_unique.sql` (zastosowana też na bazie `nawylot`).
- 2 nowe testy + poprawione dane testu mediany (każda obserwacja z innym czasem pobrania,
  bo tak wygląda prawdziwa historia).

**Decyzje**
- Do historii trafia tylko najtańszy lot dla (trasa, dzień wylotu) z danego skanu, nie każdy
  wynik — mediana ma opisywać „cenę trasy”, a nie średnią z drogich połączeń.
- Historia liczona od dnia wylotu (`date`); długość pobytu nie jest częścią klucza trasy.

---

## M3.3 — `packages/notifications`: interfejs kanału + TelegramChannel

**Plan**
- Interfejs z ARCHITECTURE.md: `NotificationChannel { id, send(user, msg) }`, `UserRef`,
  `SendResult`. Typ `AlertMessage` w `core` (treść alertu buduje logika domenowa w M3.4,
  kanał tylko ją dostarcza).
- Kanał sam ustala adres użytkownika (np. `chat_id` Telegrama) przez zależność wstrzykniętą
  przy tworzeniu kanału — nowy kanał = nowa implementacja, bez zmian w workerze.
- TelegramChannel: wymaga dokumentacji Telegram Bot API (patrz BLOKADA niżej).

**Zrobione**
- `packages/notifications/src/types.ts`: `NotificationChannel`, `UserRef`, `SendResult`,
  `ChannelId`; `core/alertMessage.ts`: typ `AlertMessage`.

**Decyzje**
- `AlertMessage` ma dwa linki (`links.flight`, `links.stay`) zamiast jednego `deepLink`
  z ARCHITECTURE.md — zasada 2. Link do oferty w naszej aplikacji dojdzie z webem (M4).
- `SendResult` rozróżnia „wysłane” i „brak adresu” (kanał włączony, konto niepołączone);
  błędy dostarczenia to wyjątki.

BLOKADA: M3.3 TelegramChannel — nie mogę potwierdzić kształtu API w dokumentacji:
core.telegram.org jest zablokowane przez politykę sieci tej sesji (sprawdzone), a innej
oficjalnej dokumentacji Bot API nie ma — potrzebuję od zespołu: dostępu do
core.telegram.org w kolejnej sesji albo wklejenia do `docs/` fragmentów dokumentacji
„Making requests”, `sendMessage` (parametry, limit długości tekstu), obiektów `Message`
i `ResponseParameters` (`retry_after` przy 429) oraz jednej nagranej odpowiedzi
`sendMessage` (sukces + błąd 403 „bot was blocked by the user”) jako fixture.

Zadanie M3.3 zostaje **nieodhaczone** w TASKS.md (interfejs jest, kanału nie ma).

---

## M3.4 — job `notify`: dispatch po preferencjach, quiet hours, deduplikacja przez alerts_sent

**Plan**
- core (czyste funkcje + testy):
  - `format.ts`: `formatMoney` („1 186 zł”), `formatTripDates` („16–18.10”),
    `formatFetchedAt` („29.09, 21:40” w strefie użytkownika).
  - `alertMessage.ts`: `buildAlertMessage` — pierwsze słowa trasa i cena (ANTI_SLOP),
    rozbicie kosztu, „Cena z … · może się zmienić” (zasada 3), dwa osobne linki.
  - `alertPolicy.ts`: `isDeal` (mieści się w budżecie i score ≥ próg), `offerFingerprint`
    (trasa + daty), `decideDelivery` (duplikat → pomiń, limit dzienny → pomiń, quiet hours →
    odłóż do ich końca, inaczej wyślij).
- worker `jobs/notify.ts`: `notifyOffer(deps, offerId, channel?)` — oferta + watch + użytkownik,
  włączone kanały z `notification_prefs`, decyzja z core, `channel.send`, zapis `alerts_sent`.
  Kolejka `notify` z polityką `singleton` per watch (jedno powiadomienie watcha naraz, żeby
  deduplikacja nie miała wyścigu). Odłożone przez quiet hours → nowy job ze `startAfter`.
- `scan-watch`: po zapisie ofert wrzuca `notify` dla ofert, które są okazją (`isDeal`).
- Testy: core jednostkowo; `notifyOffer` na Postgresie z kanałem podstawionym w teście.

**Zrobione**
- core: `format.ts` (9 testów), `alertMessage.ts` z `buildAlertMessage` (8), `alertPolicy.ts`
  z `isDeal`, `offerFingerprint`, `quietHoursRemaining`, `decideDelivery` (18).
- worker: `jobs/notify.ts` — `notifyOffer`, kolejka `notify` (`singleton` per watch, retry
  z backoffem), odkładanie przez quiet hours jako nowy job ze `startAfter` tylko dla tego kanału.
  11 testów na Postgresie (w tym 2 przez pg-boss).
- `scan-watch` zwraca `dealOfferIds` i wrzuca dla nich `notify`; id ofert generowane w kodzie
  (`randomUUID`), żeby nie polegać na kolejności `RETURNING`.

**Decyzje (wartości do potwierdzenia przez zespół)**
- `MIN_DEAL_SCORE = 0`: alert, gdy wyjazd mieści się w budżecie i cena lotu nie jest wyższa niż
  mediana trasy. Nowe trasy (brak historii → score 0) też dostają alert — inaczej przez pierwsze
  tygodnie nikt nie dostałby nic.
- `MAX_ALERTS_PER_USER_PER_DAY = 3` na kanał, okno kroczące 24 h (bez liczenia dni w strefie).
- Duplikat = ten sam wyjazd (trasa + daty, bez godzin i hotelu) tym samym kanałem; ponownie
  wysyłamy dopiero przy spadku ceny o ≥ 5% względem ostatniego alertu.
- Kolejność: duplikat → limit → quiet hours. Alert w quiet hours czeka do ich końca (a nie
  przepada); po czasie pokazuje starą datę pobrania z dopiskiem „może się zmienić”.
- Treść: tytuł „POZ → BCN, 16–18.10: 1 186 zł/os. (314 zł poniżej budżetu)”, w treści rozbicie
  kosztu i „Cena z 29.09, 21:40 · może się zmienić” w strefie użytkownika. Linki do lotu
  i noclegu osobno w `links` — kanał sam je pokaże (np. dwa przyciski).
- zod 4 w workerze do odczytu `flight_json` / `stay_json` z bazy (kolumny jsonb są bez typu).

**Do sprawdzenia ręcznie**
- **Job NIE jest zarejestrowany w `main.ts`** — czeka na kanał (BLOKADA M3.3) i adaptery.
- Czy alert odłożony przez quiet hours nie powinien przepadać, jeśli oferta ma > 12 h.
- Teksty alertu (tytuł, „mieści się w budżecie”, „Za 2 os.: …”) — przeczytajcie na głos.

---

## M3.5 — seed: 3 przykładowe watche (POZ → dowolnie, październik, 2–3 noce, 1000 zł/os)

**Plan**
- `packages/db/src/seed.ts`: użytkownik testowy (strefa Europe/Warsaw, Telegram włączony,
  quiet hours 22:00–07:00) i 3 watche POZ → dowolnie, najbliższy październik, 2–3 noce,
  1000 zł/os. Stałe UUID + upsert, więc ponowne uruchomienie nie dubluje danych.
- `pnpm db:seed` (tsx), blokada uruchomienia przy `NODE_ENV=production`.
- Testy: wybór października, seed na bazie testowej, idempotencja.

**Zrobione**
- `seed.ts` + `runSeed.ts`, skrypt `pnpm db:seed`, wpis w README. 5 testów (3 jednostkowe
  wyboru października, 2 na Postgresie). Sprawdzone ręcznie na bazie `nawylot`: dwa
  uruchomienia = 1 użytkownik, 3 watche; `NODE_ENV=production` przerywa seed.

**Decyzje**
- 3 watche różnią się tylko liczbą osób (1, 2, 4) — TASKS.md podaje jedną specyfikację dla
  wszystkich trzech, a różne `pax` pokazują liczenie kosztu na osobę.
- Październik = najbliższy, który się nie skończył (dziś: 2026). Ponowny seed przesuwa daty,
  włącza watche i zeruje `last_scanned_at`.
- Użytkownik testowy nie ma `telegram_links` — `chat_id` pojawi się po połączeniu konta (M4).
- tsx jako devDependency `packages/db` (to samo narzędzie co w workerze).

**Do sprawdzenia ręcznie**
- Watche „dowolnie” wymagają providera, który obsługuje brak celu (patrz BLOKADA M2.2).

---

## PODSUMOWANIE NOCNEJ ZMIANY

Stan: w M0–M3 nie zostało nic, co da się zrobić bez zespołu. Zrobione: 14 z 17 zadań.
Nieodhaczone: M2.2, M2.4 (BLOKADY) i M3.3 (interfejs jest, TelegramChannel zablokowany).
Na końcu: 144 testy przechodzą (z `TEST_DATABASE_URL`), `pnpm typecheck`, `pnpm lint`,
`pnpm format:check`, `pnpm install --frozen-lockfile` — czysto.

### Commity (gałąź `nocna-zmiana`, od najstarszego)
1. `223ffa0` chore: pnpm workspace, tsconfig strict, eslint, prettier, vitest
2. `d68ab8a` feat: packages/db ze schematem Drizzle i pierwszą migracją
3. `c3704e3` feat: worker z pg-boss i jobem heartbeat co minutę
4. `da35bbe` chore: CI w GitHub Actions (typecheck, lint, format, test z Postgresem)
5. `40c38ea` feat(core): typ Money w jednostkach minor z dodawaniem i porównaniami
6. `004d2f0` feat: core/totalCost — koszt wyjazdu z rozbiciem na lot, nocleg i bagaż
7. `2b04aa3` feat: core/scoreDeal — score okazji względem mediany historii trasy
8. `8f4606c` feat: core/expandWatch — zapytania daty × noce × lotniska z limitem i rotacją
9. `c572c76` feat: core/limits — dobowy budżet zapytań na watch i podział na skan
10. `10eca62` feat: interfejsy FlightProvider i StayProvider w packages/providers
11. `71a618a` docs: BLOKADA adaptera SerpAPI Google Flights w NIGHT_LOG
12. `b18ed6c` feat: cache odpowiedzi providerów w pamięci z TTL 6 h
13. `75bf1d4` docs: BLOKADA adaptera SerpAPI Google Hotels w NIGHT_LOG
14. `e24ebc8` feat: job scan-watch z planowaniem skanów co 15 minut
15. `5cc431b` feat: zapis price_history w scan-watch bez duplikatów obserwacji
16. `59d32ca` feat: interfejs NotificationChannel i typ AlertMessage (bez TelegramChannel)
17. `509386d` feat: job notify z quiet hours, limitem dziennym i deduplikacją przez alerts_sent
18. `9875c44` test: limit czasu testów z pg-boss dłuższy niż ich oczekiwanie na job
19. `60b983a` feat: seed z użytkownikiem testowym i 3 watchami POZ → dowolnie
20. ten commit — podsumowanie w NIGHT_LOG.md

(Commit 5 ma zakres w typie — `feat(core):` — wbrew formatowi `<typ>: <opis>`; nie poprawiałem,
bo wymagałoby to przepisania historii i force pusha.)

### Blokady
1. **M2.2 adapter SerpAPI Google Flights** — serpapi.com zablokowane przez politykę sieci sesji,
   nie da się potwierdzić kształtu odpowiedzi (m.in. cena za osobę czy za wszystkich, lot
   powrotny, „dowolny kierunek”). Potrzebne: nagrana odpowiedź JSON albo dostęp do serpapi.com
   + decyzja, jak obsłużyć watch „dowolnie”.
2. **M2.4 adapter SerpAPI Google Hotels** — j.w.; dodatkowo decyzja, jak zamienić kod IATA celu
   na miejsce noclegu.
3. **M3.3 TelegramChannel** — core.telegram.org zablokowane. Potrzebne: dostęp albo fragmenty
   dokumentacji Bot API (`sendMessage`, `Message`, `ResponseParameters`) + nagrane odpowiedzi.

Skutek: pętla end-to-end **nie działa jeszcze w uruchomionym workerze**. `scan-watch` i `notify`
są zaimplementowane i przetestowane na podstawionych providerach/kanale, ale `main.ts`
rejestruje tylko `heartbeat` — rejestracja reszty to kilka linijek po dodaniu adapterów i kanału
(opis przy M3.1 i w komentarzu w `apps/worker/src/main.ts`).

### 3 najważniejsze rzeczy do przejrzenia przez człowieka
1. **Wartości produktowe, które ustawiłem roboczo** — wszystkie w `packages/core`, każda
   z testami, łatwo zmienić:
   `DAILY_QUERY_BUDGET_PER_WATCH = 24` i `MAX_STAY_QUERIES_PER_SCAN = 3` (`limits.ts`, koszt!),
   `MIN_DEAL_SCORE = 0`, `MAX_ALERTS_PER_USER_PER_DAY = 3`, `SIGNIFICANT_DROP_PERCENT = 5`
   (`alertPolicy.ts`), `BAGGAGE_ESTIMATE_PER_PERSON_MINOR = 0` (`totalCost.ts`),
   `MIN_HISTORY_SAMPLES = 5`, `HISTORY_WINDOW_DAYS = 90` (`scoreDeal.ts`).
2. **Interfejs providerów (`packages/providers/src/types.ts`) względem prawdziwego SerpAPI** —
   zaprojektowany bez dostępu do dokumentacji. Przy pisaniu adapterów sprawdźcie zwłaszcza
   `pricePerPerson`, `inbound: null` (lot powrotny) i `destination: null` („dowolnie”);
   od tego zależą `scan-watch` i seed.
3. **Treść alertu i zachowanie powiadomień** (`core/alertMessage.ts`, `core/alertPolicy.ts`):
   przeczytajcie tytuł/treść na głos (ANTI_SLOP), sprawdźcie, czy alert odłożony przez quiet
   hours ma czekać (teraz: tak), i czy deduplikacja „trasa + daty” jest tym, czego chcecie.
