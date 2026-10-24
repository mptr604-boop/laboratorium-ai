# Przykład: odczyt tylko temperatury

Najmniejsza wersja architektury laboratorium-iot: parser → kontrakt → baza (WAL) → statystyki błędów → log JSON.
Opis i uzasadnienia: [docs/WZORZEC.md](../../docs/WZORZEC.md).

```bash
npm test          # 8 testów, zero zależności (Node 24, node:sqlite)
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
