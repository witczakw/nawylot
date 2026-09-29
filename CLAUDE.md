# CLAUDE.md — kontekst dla Claude Code

## Czym jest projekt
Watcher wyjazdów (loty + noclegi) z budżetem. Użytkownik definiuje „watch”
(skąd, dokąd lub „dowolnie”, okno dat, długość wyjazdu, liczba osób, budżet całkowity).
Worker cyklicznie pobiera ceny, liczy koszt całkowity i wysyła alert, gdy oferta
spełnia reguły. Alert zawiera link do zakupu u partnera. Zespół: 3 osoby, projekt po godzinach —
priorytet to działające MVP, nie architektura na wyrost.

## TWARDE ZASADY (nie łamać bez decyzji zespołu)
1. **Nie kupujemy za użytkownika i nie przechowujemy danych kart.** Żadnego checkoutu,
   żadnego „auto-buy”, żadnych wpłat „budżetu”. Tylko alert + link.
2. **Nie łączymy lotu i noclegu w jedną sprzedaż.** Pokazujemy je razem informacyjnie,
   ale każdy link prowadzi do osobnego dostawcy (unikamy statusu organizatora turystyki).
3. Ceny w alercie zawsze z datą pobrania i dopiskiem, że mogą się zmienić.
4. Każde źródło danych wyłącznie przez adapter w `packages/providers` implementujący
   wspólny interfejs. Zero wywołań zewnętrznych API z `apps/web` bezpośrednio.
5. Sekrety tylko w `.env`, nigdy w kodzie ani w commitach.
6. Szanuj limity i koszty API: cache wyników, backoff, budżet zapytań na watch (patrz `packages/core/src/limits.ts`).

## Stack
- TypeScript (strict), pnpm workspaces, Node 20+
- `apps/web`: Next.js (App Router), Tailwind; API jako route handlers w `app/api/*`
- `apps/worker`: Node + pg-boss (kolejka na Postgresie — bez Redisa)
- `packages/db`: Drizzle ORM + Postgres (lokalnie docker, produkcyjnie Supabase/Neon)
- `packages/billing`: Stripe (Checkout, Customer Portal, webhooki, entitlements)
- `packages/notifications`: kanały alertów za wspólnym interfejsem (MVP: Telegram)
- Testy: Vitest. Każda funkcja w `packages/core` ma testy.

## Zasady architektury (żeby aplikacja mobilna w przyszłości nie wymagała przepisywania)
- Logika domenowa tylko w `packages/core` (czysty TS, bez I/O). Komponenty Reacta i route handlery jej NIE duplikują.
- Route handlery w `app/api/*` to cienka warstwa: walidacja zod → wywołanie `core`/`db` → JSON. Mogą później obsłużyć też aplikację.
- Worker wysyła alerty wyłącznie przez `packages/notifications` — nowy kanał (push, e-mail) = nowa implementacja interfejsu, bez zmian w workerze.

## Płatności (szczegóły: docs/BILLING.md)
- Stripe tylko za dostęp do naszej usługi. NIGDY za loty, noclegi ani „budżet na wyjazd”.
- Stan planu użytkownika wyłącznie z webhooków Stripe → tabela `entitlements`. Worker i UI czytają tylko `entitlements`.
- Każdy webhook: weryfikacja podpisu + idempotencja przez `stripe_events`.
- Kolejność okazji nigdy nie zależy od prowizji afiliacyjnej.
- Kod płatności tylko w `packages/billing` i `app/api/billing/*`.

## Design i teksty
- Przed każdą zmianą UI lub tekstu przeczytaj `docs/DESIGN.md` i `docs/ANTI_SLOP.md`.
- Kolory, fonty, promienie tylko z `apps/web/src/styles/tokens.css`. Żadnych hexów w komponentach.
- `sygnal` (żółty) wyłącznie przy okazjach i jednej głównej akcji na ekranie.
- Teksty w UI po polsku, na „Ty”, konkretnie, bez zwrotów z listy zakazanych.

## Konwencje
- Kwoty w groszach/centach jako integer + kod waluty. Nigdy float.
- Daty w UTC w bazie, strefa użytkownika tylko na wyjściu.
- Kody lotnisk IATA, kraje ISO-3166.
- Małe PR-y, jedna rzecz na commit, opis po polsku lub angielsku — byle spójnie.
- Zanim dodasz nową zależność — uzasadnij w opisie commita.

## Komendy
- `pnpm dev` — web + worker
- `pnpm test` — testy
- `pnpm lint` / `pnpm typecheck`
- `pnpm db:generate` / `pnpm db:migrate`

## Gdzie szukać
- Wymagania produktu: `docs/PRD.md`
- Architektura i przepływ danych: `docs/ARCHITECTURE.md`
- Źródła danych i ich ograniczenia: `docs/DATA_SOURCES.md`
- Ograniczenia prawne/biznesowe: `docs/CONSTRAINTS.md`
- Design: `docs/DESIGN.md`, anti-slop: `docs/ANTI_SLOP.md`
- Płatności: `docs/BILLING.md`
- Kolejka zadań: `docs/TASKS.md` (aktualizuj checkboxy po zrobieniu)
