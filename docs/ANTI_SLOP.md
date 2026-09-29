# Anti-slop — zasady dla ludzi i dla Claude Code

„Slop” to domyślne, generyczne wybory, które od razu zdradzają, że coś zostało
wygenerowane bez namysłu. Poniższe zasady obowiązują w każdym PR.

## 1. UI

Nie robimy:
- tła kremowego `#F4F1EA` + serifowego nagłówka + terakotowego akcentu
- czarnego tła z jednym kwasowo-zielonym akcentem
- „SaaS-kitu”: wszystko w identycznych zaokrąglonych kartach z tym samym szarym cieniem
- gradientów jako dekoracji (fioletowo-niebieskich tym bardziej)
- etykiet w CAPS LOCKU z rozstrzeloną literą nad każdym nagłówkiem
- wyróżniania jednego słowa w nagłówku innym kolorem lub kursywą
- numerków 01 / 02 / 03, jeśli treść nie jest faktycznie sekwencją
- strzałki „→” doklejonej do każdego przycisku i linku
- animacji wjazdu (fade + slide) na każdej sekcji i hovera na każdej karcie
- sekcji „hero” z wielką liczbą, trzema statystykami i gradientem
- ikon-emoji jako grafiki (✈️🌴🌍) w interfejsie
- zdjęć stockowych: palma, walizka, kobieta w kapeluszu na plaży
- ilustracji w stylu korporacyjnych postaci z długimi rękami

Robimy: tokeny z `apps/web/src/styles/tokens.css`, zasady z `docs/DESIGN.md`.

## 2. Teksty w interfejsie (copy)

Zakazane słowa i zwroty: „Odkryj”, „Twoja przygoda czeka”, „magia podróży”, „bezproblemowo”,
„rewolucyjny”, „przenieś podróże na wyższy poziom”, „w zaledwie kilka kliknięć”,
„idealny/perfekcyjny wyjazd”, „świat stoi otworem”, „AI-powered” w komunikatach dla użytkownika.

Zasady:
- Konkret zamiast obietnicy. ✗ „Znajdziemy dla Ciebie idealny wyjazd” → ✓ „Pilnujemy cen lotów i noclegów. Piszemy, gdy wyjazd zmieści się w budżecie.”
- Przycisk mówi, co się stanie: „Zapisz watch”, „Zobacz lot”, „Połącz Telegram”. Nie „Wyślij”, nie „Dalej →”.
- Ta sama akcja ma tę samą nazwę w całym przepływie („Zapisz watch” → komunikat „Watch zapisany”).
- Błędy mówią, co się stało i co zrobić. Bez przeprosin i bez „Ups!”.
  ✗ „Ups! Coś poszło nie tak 😢” → ✓ „Nie udało się pobrać cen z BCN. Spróbujemy ponownie o 22:00.”
- Pusty ekran zaprasza do działania: „Nie masz jeszcze watcha. Ustaw pierwszy: skąd lecisz i ile chcesz wydać.”
- Wielka litera tylko na początku zdania. Bez wykrzykników w interfejsie.
- Zwracamy się na „Ty”, krótko, jak znajomy, który zna się na tanich lotach. Nie jak broszura.
- Alerty push/Telegram: pierwsze słowa = trasa i cena. „POZ → BCN, 17–19.10: 1 186 zł/os. (314 zł poniżej budżetu)”.

## 3. Treści generowane przez AI w produkcie
- Ceny, daty, nazwy linii i hoteli pochodzą **wyłącznie** z odpowiedzi providerów. LLM nigdy ich nie generuje ani nie „uzupełnia”.
- Jeśli używamy LLM (np. krótki opis kierunku), to tylko na danych, które mamy, bez przymiotników typu „urokliwy”, „tętniący życiem”, „malowniczy”.
- Każdy tekst z LLM ma limit długości i przechodzi przez listę zakazanych zwrotów z sekcji 2 (test w `packages/core`).

## 4. Kod

Nie robimy:
- komentarzy opisujących, co robi oczywista linijka (`// increment counter`)
- abstrakcji „na przyszłość” bez drugiego użycia (fabryki, managery, `BaseService`)
- `try/catch`, który połyka błąd albo tylko go loguje i idzie dalej
- `any`, `as unknown as`, `// @ts-ignore` bez komentarza z uzasadnieniem
- zmyślonych pól w odpowiedziach API — kształt danych tylko z dokumentacji lub nagranych fixture'ów
- danych mockowych w ścieżkach produkcyjnych
- stubów udających gotową funkcję (`return []  // TODO`) bez oznaczenia zadania w TASKS.md jako niezrobione
- nowych zależności do rzeczy na 10 linijek
- `console.log` w commitach (jest logger)
- plików README/opisów w każdym folderze „dla porządku”
- przepisywania działającego kodu przy okazji innego zadania

Robimy:
- najprostsze rozwiązanie, które przechodzi testy
- nazwy z domeny (watch, offer, totalCost), nie ogólniki (data, item, handler2)
- test dla każdej funkcji w `core` na realnych przypadkach (np. lot 23:50, nocleg od następnego dnia)

## 5. Checklista przed PR
- [ ] Czy jakikolwiek element UI łamie sekcję 1?
- [ ] Czy nowy tekst przeszedłby test „czy powiedziałbym to znajomemu”?
- [ ] Czy `sygnal` (żółty) pojawia się tylko przy okazjach / głównej akcji?
- [ ] Czy ceny pokazują datę pobrania?
- [ ] Czy nie ma mocków, `any`, połkniętych błędów, zbędnych komentarzy?
