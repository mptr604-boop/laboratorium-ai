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
