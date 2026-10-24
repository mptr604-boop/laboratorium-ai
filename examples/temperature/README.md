# Przykład: odczyt tylko temperatury

Najmniejsza wersja architektury laboratorium-iot: parser → kontrakt → baza (WAL) → statystyki błędów → log JSON.
Opis i uzasadnienia: [docs/WZORZEC.md](../../docs/WZORZEC.md).

```bash
npm install       # tylko zod (walidacja wyjścia asystenta)
npm test          # 23 testy (Node 24, node:sqlite)
npm run demo      # asystent z atrapą modelu na 3 wzorcach
npm start         # serwer na :3000, baza w temperature.sqlite

curl -X POST -d "TEMP: 23.4 C" localhost:3000/devices/1/readings   # 201
curl -X POST -d "ERR"          localhost:3000/devices/1/readings   # 201, status DEVICE_FAULT
curl -X POST -d "TEMP: 900 C"  localhost:3000/devices/1/readings   # 422, kontrakt nazywa pole
curl localhost:3000/devices/1/stats                                # odsetek błędów, seria, okresowość
```

Zakres temperatur (−50..100 °C) to założenie przykładu.

## API (zamiast Swaggera)

| Metoda i ścieżka | Body | Odpowiedzi |
|---|---|---|
| `POST /devices/{id}/readings` | surowy tekst z aparatu, np. `TEMP: 23.4 C` albo `ERR` | `201` zapisano (także `ERR` i śmieci, z odpowiednim statusem), `413` body > 1 KB, `422` kontrakt odrzucił zapis |
| `GET /devices/{id}/stats` | – | `200`: `total`, `faults`, `faultRate`, `currentStreak`, `periodEvery`, `enoughData` (z 50 ostatnich pomiarów) |
| inne | – | `404` nieznana ścieżka, `405` zła metoda |

## Sprawdzenie curlem jednym poleceniem

```bash
./scripts/smoke.sh
```

Skrypt sam startuje serwer na tymczasowej bazie, wysyła poprawne i błędne ramki, sprawdza kody HTTP (PASS/FAIL) i scenariusz „co trzeci pomiar to ERR" dla statystyk. Kończy się kodem `0`, gdy wszystko jest OK, więc nadaje się też do CI.
Test na działającym serwerze: `BASE_URL=http://localhost:3000 ./scripts/smoke.sh` (zapisze dane do jego bazy).
`curl` używa `--data-raw`, bo zwykłe `-d` traktuje tekst zaczynający się od `@` jako nazwę pliku.

## Asystent AI (`src/assistant/`)

Kod liczy statystyki, model je interpretuje, człowiek zatwierdza. Asystent ma **tylko narzędzia do odczytu** (`get_error_stats`, `get_recent_measurements`, `describe_contract`). Wyjście modelu waliduje zod (`schema.js`), a odpowiedź poza schematem jest odrzucana. Dane z narzędzi są oznaczone jako niezaufane, a przy małej próbce kod nie pozwala ogłosić anomalii.

- `mock-model.js`: deterministyczna atrapa do testów (bez kosztów). Testuje otoczkę, nie jakość prawdziwego modelu.
- `llm-model.js`: adapter API zgodnego z OpenAI (`LAB_AI_KEY`, `LAB_AI_MODEL`, opcjonalnie `LAB_AI_URL`). **Nie był uruchamiany na prawdziwym API**, tylko testowany z podstawionym `fetch`.
- `test/assistant.test.js`: zestaw ewaluacyjny (cykl, seria, mała próbka, brak anomalii) i testy strażników (injection, schemat, pętla, argumenty).
