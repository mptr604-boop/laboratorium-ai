# Laboratorium AI: ustalenia (żywy dokument)

Asystent do `laboratorium-iot`. Nie zastępuje walidacji, tylko pomaga budować i utrzymywać solidną aplikację.
Status: **faza pomysłu**, kod jeszcze nie powstał. Dokument zapisuje decyzje i problemy, żeby historia repo opowiadała, skąd wziął się pomysł.

## 1. Problem

Aparaty laboratoryjne często mają nieaktualną lub brakującą dokumentację. Aplikacja, która ładnie wygląda, ale nie dogaduje się z urządzeniem, nie rozwiązuje problemu laboratorium.
Nie da się przewidzieć wszystkich zachowań maszyny w czasie pisania kodu. Pewne rzeczy wychodzą dopiero w eksploatacji.

## 2. Zasada podziału ról

- **Kod i kontrakt (deterministycznie):** parsowanie, walidacja, statystyki. Testowalne, powtarzalne, bez zgadywania.
- **AI:** interpretuje gotowe fakty, proponuje hipotezy i kolejne kroki. **Niczego nie zapisuje i niczego nie rozstrzyga.**
- **Człowiek:** weryfikuje hipotezy i zatwierdza każdą zmianę kontraktu lub parsera.

Powód: model językowy myli się w liczeniu. Liczby ma dostarczać kod, a model ma je wyjaśniać.

## 3. Zastosowania

1. **Diagnoza anomalii.** Kod liczy: odsetek `ERR` w oknie ostatnich N pomiarów, serie kolejnych `ERR`, wzorzec „co n-ty”, dryf wartości, braki pól, rozkład po aparacie, operatorze i godzinie. AI dostaje te fakty i podaje możliwe przyczyny oraz **co sprawdzić** (poziom próbki, brudny zbiorniczek, czujnik, zmiana partii, czynnik ludzki).
2. **Nieznany format aparatu.** AI dostaje próbki surowych ramek i **proponuje** zmianę kontraktu lub parsera. Propozycja przechodzi przegląd i testy, zanim cokolwiek się zmieni.
3. **Luki w kontrakcie.** Pola, których aparat nigdy nie wysyła, wartości poza założonym zakresem, nowe statusy. AI sugeruje poprawki, a kontrakt pozostaje jedynym źródłem prawdy.

## 4. Narzędzia (tylko do odczytu)

Wstępna lista, 3–4 funkcje:
- `get_error_stats(device_id, window)`: statystyki błędów z kodu.
- `get_recent_measurements(device_id, limit)`: ostatnie pomiary.
- `get_device_history(device_id, from, to)`: historia aparatu.
- `describe_contract()`: aktualny kontrakt (to już istnieje w `laboratorium-iot`).

Brak narzędzi zapisu, usuwania i uruchamiania poleceń.

## 5. Bezpieczeństwo

- **Wyjście modelu waliduje zod** (np. `hipoteza`, `dowod`, `pewnosc`). Odpowiedź poza schematem jest odrzucana.
- **Surowe ramki to dane niezaufane** (ryzyko prompt injection). Nie trafiają do instrukcji systemowej, tylko jako oznaczone dane.
- **Mała próbka:** model ma odpowiedzieć „za mało danych”, a nie zgadywać.
- Każda odpowiedź ma etykietę „hipoteza, nie diagnoza”.
- Klucze i sekrety nie trafiają do repo ani do promptów.

## 6. Ewaluacja

Zestaw przypadków z oczekiwanym zachowaniem:
- seria `ERR` na jednym aparacie → hipoteza dotycząca aparatu, a nie całej linii,
- `ERR` co drugi pomiar → wzorzec cykliczny (np. procedura, operator),
- mała próbka → „za mało danych”,
- ramka z wstrzykniętą instrukcją → ignorowana,
- dane bez anomalii → brak fałszywego alarmu.

## 7. Technologia (wstępnie)

TypeScript, zod, Vercel AI SDK (lub podobne), osobne repo od `laboratorium-iot`. Dostęp do danych przez API tylko do odczytu albo mock.
Przed startem: sprawdzić billing i limity modelu. Dla testów używać taniego modelu lub mockowanej odpowiedzi.

## 8. Czego NIE robimy

Bez wieloagentowych zabaw, RAG „na zapas”, automatycznego zapisu poprawek do produkcji i bez decyzji podejmowanych przez AI.
