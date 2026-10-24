# STATUS: czytaj to najpierw

Aktualizuj ten plik w tym samym commicie, w którym zmienia się kod lub decyzja. Trzymaj go krótkim (cel: poniżej 150 linii).

**Ostatnia aktualizacja:** 2026-10-24 · **Wersja:** 0.1.0 (faza projektowania, brak kodu AI)

## 1. Czym jest ten projekt

Asystent AI do [laboratorium-iot](https://github.com/mptr604-boop/laboratorium-iot): wykrywa wzorce błędów aparatów i podpowiada, co sprawdzić.
Zasada: **kod liczy, AI interpretuje, człowiek zatwierdza.** Szczegóły: [USTALENIA.md](./USTALENIA.md).

## 2. Mapa plików

| Ścieżka | Co tam jest |
|---|---|
| `docs/USTALENIA.md` | Decyzje, zakres, bezpieczeństwo, ewaluacja, otwarte pytania |
| `docs/WZORZEC.md` | Wzorzec architektury (parser → kontrakt → baza → statystyki → AI) |
| `docs/STATUS.md` | Ten plik |
| `examples/temperature/` | Działający przykład na jednym polu: `npm test` (8 testów), `./scripts/smoke.sh` (curl) |

## 3. Stan funkcji

| Funkcja | Stan |
|---|---|
| Parser, kontrakt, baza WAL, statystyki błędów, logi JSON (przykład temperatury) | ✅ działa, przetestowane |
| Smoke test curlem | ✅ działa |
| Narzędzia tylko do odczytu dla modelu (`get_error_stats` itd.) | ⏳ nie zaczęte |
| Integracja z modelem (AI SDK + zod na wyjściu) | ⏳ nie zaczęte |
| Zestaw ewaluacyjny (anomalie, mała próbka, prompt injection) | ⏳ nie zaczęte |
| Połączenie z prawdziwym `laboratorium-iot` (API tylko do odczytu) | ⏳ nie zaczęte |

## 4. Znane problemy i ograniczenia (stan faktyczny, bez upiększeń)

- Zakres temperatur −50..100 °C to **założenie** przykładu, nie dane z aparatu.
- `errorStats` uznaje „za mało danych" poniżej 10 pomiarów. Próg jest arbitralny.
- `periodEvery` wykrywa tylko **idealnie** stały odstęp (min. 4 błędy). Nieregularne wzorce go nie złapią.
- Przykład nie ma uwierzytelniania i rate limitingu (celowo, to szkic).
- Wynik wydajności z `laboratorium-iot` to lokalny loopback, nie produkcja.
- `curl -d` traktuje tekst zaczynający się od `@` jako plik; używaj `--data-raw`.

## 5. Decyzje (żeby ich nie dyskutować od nowa)

- Brak RAG, wieloagentowości, Kubernetesa, RabbitMQ. Brak zapisu przez AI.
- Model ma **tylko** narzędzia do odczytu; wyjście walidowane zod; surowe ramki to dane niezaufane.
- Statystyki liczy kod, nie model.
- Komentarze w kodzie po polsku, identyfikatory po angielsku.
- Repo lokalne, **bez remote**, dopóki użytkownik nie zdecyduje o publikacji.

## 6. Następne kroki

1. Sprawdzić billing / limity modelu (przed jakimkolwiek wywołaniem API).
2. Narzędzia tylko do odczytu na bazie `examples/temperature`.
3. Zestaw ewaluacyjny z mockowanym modelem (bez kosztów).
4. Dopiero potem prawdziwy model.

## 7. Dziennik zmian

| Data | Zmiana |
|---|---|
| 2026-10-24 | Ustalenia i zakres (`USTALENIA.md`) |
| 2026-10-24 | Wzorzec i przykład temperatury (parser, kontrakt, WAL, statystyki, logi) |
| 2026-10-24 | `scripts/smoke.sh` (curl zamiast Swaggera) |
| 2026-10-24 | `STATUS.md` i `AGENTS.md` (szybki start dla agentów) |
