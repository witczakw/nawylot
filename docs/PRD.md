# PRD — MVP

## Problem
Ludzie chcą wyjechać tanio, ale nie mają czasu codziennie sprawdzać cen.
Istniejące alerty (Google Flights, Fly4free) pilnują pojedynczego lotu, nie **całego wyjazdu w budżecie**.

## Użytkownik MVP
Osoba z Polski, wyjazdy weekendowe/krótkie (2–5 dni), budżet całkowity np. 800–2000 zł/os.

## Watch — definicja
- lotnisko wylotu (1–3, np. POZ, WRO, BER)
- kierunek: konkretne miasta/kraje LUB „dowolnie”
- okno dat (np. październik–listopad) + długość (2–4 noce) + preferowane dni (pt–nd)
- liczba osób
- budżet całkowity (lot + nocleg) na osobę
- minimalny standard noclegu (ocena, typ)

## Co robi system
1. Co N godzin pobiera ceny lotów dla kombinacji z watcha (z limitem zapytań).
2. Dla obiecujących lotów dobiera noclegi na te daty.
3. Liczy koszt całkowity (+ szacunek bagażu) i score okazji (cena vs historia trasy).
4. Jeśli mieści się w budżecie i score > próg → alert na Telegram z linkami.
5. Nie wysyła duplikatów; wysyła ponownie tylko przy istotnym spadku ceny.

## Poza MVP
Kupowanie, płatności, konta firmowe, aplikacja mobilna, rekomendacje atrakcji.

## Metryki walidacji (4 tygodnie, 10–30 znajomych)
- % watchy, które dostały ≥1 alert
- CTR z alertów
- ile osób faktycznie kupiło wyjazd z alertu (pytamy ręcznie)
- ile osób utworzyło drugi watch
