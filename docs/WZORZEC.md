# Wzorzec: jak zbudowane jest laboratorium-iot (wersja do wejścia w projekt)

Dla nowej osoby w zespole. Wszystko na **jednym polu: temperaturze**, żeby przepływ było widać w 10 minut.
Działający kod: [`examples/temperature/`](../examples/temperature) (`npm test`, zero zależności, Node 24).

## 1. Przepływ danych

```
aparat / ESP32 --surowy tekst--> parser --> kontrakt --> baza (WAL) --> statystyki --> (AI: hipotezy)
                                    |          |            |
                                  nie rzuca   odrzuca     log JSON
                                  wyjątków    błędne      na każdym kroku
```

| Warstwa | Plik w przykładzie | Zadanie | Odpowiednik w laboratorium-iot |
|---|---|---|---|
| Parser | `src/parse.js` | Zamienia tekst z aparatu na dane. Śmieci → status, a nie wyjątek | `src/utils/parser.js` |
| Kontrakt | `src/contract.js` | Jedno źródło prawdy: co jest poprawnym odczytem. Działa też jako dokumentacja | `src/contracts/measurement.contract.js` |
| Baza | `src/store.js` | Zapis w WAL, kontrakt sprawdzany **w momencie zapisu** | `src/models/db.operations.js` |
| Statystyki | `src/stats.js` | Liczy odsetek błędów, serie i wzorzec „co n-ty”. To kod, nie AI | (nowe: baza pod asystenta AI) |
| Serwer + logi | `src/server.js` | Endpointy, limit rozmiaru, log JSON na zdarzenie | `src/http_server.js`, `src/utils/logger.js` |
| Testy | `test/` | Parser, kontrakt, brak obejścia kontraktu, statystyki | `src/test/` |

## 2. Dlaczego tak (co to chroni)

| Ryzyko w rzeczywistości | Co je łapie |
|---|---|
| Aparat wysyła `ERR` albo śmieci | Parser zwraca status `DEVICE_FAULT` / `CORRUPTED_TRANSMISSION`, a aplikacja się nie wywala |
| Dokumentacja aparatu jest nieaktualna, a pomiar ma absurdalną wartość (900 °C) | Kontrakt odrzuca zapis i podaje **nazwę pola**; błąd widać w logu |
| Wszyscy zakładają, że ktoś sprawdził dane przed zapisem | Kontrakt siedzi w `save()`, więc żadna ścieżka wejścia go nie ominie |
| Awaria prądu lub procesu w trakcie zapisu | WAL: baza wraca do spójnego stanu, a nie zostaje w połowie zapisana |
| „Coś się psuje, ale nie wiemy kiedy ani gdzie" | Log JSON: jedna linia na zdarzenie, łatwe filtrowanie |
| Aparat sypie błędami regularnie (np. co trzeci pomiar) | `errorStats`: odsetek, bieżąca seria, okresowość. To fakty dla człowieka lub AI |
| Zbyt duża ramka, atak lub wada urządzenia | Limit rozmiaru body (413) |

## 3. Typowe błędy, które ten układ wychwytuje (z testami)

- **Parser wywala się na `null`/śmieciach** → test „parser never throws on garbage".
- **`null` zapisany jako `0`** (cichy błąd, 0 °C wygląda wiarygodnie) → kontrakt wymaga `null` przy awarii, a przy `OK` liczby w zakresie.
- **Walidacja tylko w jednym miejscu** (np. w HTTP, ale nie w TCP) → walidacja w `save()`.
- **Statystyki z za małej próbki** → `enoughData: false`, więc model ma odpowiedzieć „za mało danych".

## 4. Wydajność (podstawy)

- Indeks `(device_id, id)` pod zapytanie „ostatnie N pomiarów urządzenia".
- Prepared statements (SQL kompilowany raz).
- Limit liczby rekordów w oknie statystyk (`LIMIT`), a nie skanowanie całej tabeli.
- Pomiar zamiast zgadywania: w laboratorium-iot jest `npm run perf` (lokalny loopback: HTTP ok. 20k req/s, TCP ok. 7k ramek/s; to **nie** wynik produkcyjny).

## 5. Czego ten wzorzec świadomie NIE ma

Frameworka (Express), zod, uwierzytelniania, wielu pól. To szkic pokazujący **przepływ i zasady**. W laboratorium-iot jest więcej (JWT, RBAC, SSR, TCP). W projekcie AI do walidacji wyjścia modelu użyjemy zod.

## 6. Zasada wyboru: problem przed wzorcem

Priorytet to **poprawność działania z prawdziwym urządzeniem**: kod ma rozwiązywać problem laboratorium. Wzorce służą temu celowi:
- Mały skrypt, który naprawdę dogaduje się z aparatem, jest wart więcej niż ładna architektura, która tego nie robi.
- Struktura (warstwy, kontrakt, testy) jest **proporcjonalna do ryzyka**: im większa cena błędu, tym więcej jej potrzeba. Tu błąd = zły wynik badania, więc warto.
- Nie przeciwstawiam „dobrego kodu" „rozwiązywaniu problemu". Dobry kod to taki, który rozwiązuje problem i da się go utrzymać.

## 7. Wejście nowej osoby w projekt (plan na jeden dzień)

1. Uruchom `npm test` i przeczytaj `test/temperature.test.js` (opisuje oczekiwane zachowanie).
2. Przeczytaj `contract.js` (co jest poprawne) i `parse.js` (co przychodzi z aparatu).
3. Wyślij ramki ręcznie (`curl -X POST -d "ERR" localhost:3000/devices/1/readings`) i sprawdź `GET /devices/1/stats` oraz logi.
4. Dopiero potem czytaj pełne laboratorium-iot: ta sama struktura, więcej pól.
