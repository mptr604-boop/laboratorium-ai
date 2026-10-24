# ESP32 + DHT11: fizyczne źródło danych

[main.cpp](./main.cpp) to szkic wgrywany na ESP32 (PlatformIO, konfiguracja w [platformio.ini](./platformio.ini)). DHT11 jest podłączony do pinu 23.

Odczyt DHT11 jest napisany ręcznie (bez biblioteki DHT), z limitem czasu na każdy krok i sumą kontrolną. Wersja z biblioteką przy odpiętym czujniku restartowała płytkę (watchdog) i zalewała port zrzutami paniki. Nowa wypisuje `Blad odczytu …` co 2 s. Sprawdzone na płytce: odczyty poprawne.

## Jak dane płyną

```text
ESP32 --USB (115200)--> most serial->TCP (laboratorium-iot: npm run esp32) --> baza --> asystent AI
```

1. Wgraj szkic i **zamknij monitor portu** (portu może czytać tylko jeden proces, inaczej giną znaki).
2. W `laboratorium-iot`: `npm run seed`, `npm run tcp`, `npm run esp32`.
3. Bez płytki: `ESP32_SIMULATE=1 npm run esp32` wysyła te same linie z symulatora.

`examples/temperature` w tym repo rozumie te same linie (temperatura, bez wilgotności).

## Zastrzeżenia

- DHT11: ±2 °C i ±5 % wilgotności. To czujnik dydaktyczny.
- Suma kontrolna jest sprawdzana w firmware. Zła suma to `Blad odczytu … zla suma kontrolna`.
- Odpięty czujnik na żywo sprawdzono tylko dla starej wersji szkicu.
