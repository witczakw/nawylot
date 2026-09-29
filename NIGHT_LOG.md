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
