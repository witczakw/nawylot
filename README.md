# Nawylot

**Znamy ceny na wylot.**

Watcher wyjazdów: użytkownik podaje budżet, kierunki (albo „zaskocz mnie”) i okno terminów.
System 24/7 pilnuje cen lotów i noclegów, liczy **całkowity koszt wyjazdu** i wysyła alert,
gdy trafi się okazja mieszcząca się w budżecie. **Kupuje człowiek** — jednym kliknięciem przez link partnera.

> Nie trzymamy pieniędzy klientów i nie kupujemy za nich. Dlaczego — patrz `docs/CONSTRAINTS.md`.

## Struktura
```
apps/web            Next.js — UI + API (route handlers)
apps/worker         scheduler + joby: pobieranie cen, scoring, alerty
packages/core       logika domenowa (koszt całkowity, scoring, reguły budżetu)
packages/providers  adaptery źródeł cen (loty, noclegi)
packages/billing    Stripe: pass, abonament, webhooki, uprawnienia
packages/notifications  kanały alertów (MVP: Telegram)
packages/db         schemat Drizzle + migracje (Postgres)
docs/               PRD, architektura, ograniczenia, plan zadań
```

## Start
```bash
pnpm install
cp .env.example .env        # uzupełnij klucze
docker compose up -d db     # lokalny Postgres
pnpm db:migrate
pnpm dev                    # web + worker
```

Testy integracyjne z bazą używają osobnej bazy i są pomijane, gdy `TEST_DATABASE_URL` nie jest ustawiony:
```bash
docker compose exec db createdb -U nawylot nawylot_test
TEST_DATABASE_URL=postgres://nawylot:nawylot@localhost:5432/nawylot_test pnpm test
```

## Praca z Claude Code
Kontekst i zasady projektu są w `CLAUDE.md`. Kolejne zadania: `docs/TASKS.md`.
Typowy start sesji: „Przeczytaj CLAUDE.md i docs/TASKS.md, weź pierwsze niezrobione zadanie.”
