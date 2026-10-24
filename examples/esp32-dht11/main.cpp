// Szkic ESP32 + DHT11 (PlatformIO / Arduino). Źródło danych dla laboratorium-iot i laboratorium-ai.
// Wypisuje co 2 s jedną linię przez USB (115200 baud). Format jest kontraktem z parserami:
//   Temperatura: 23.7 C, Wilgotnosc: 42 %
//   Blad odczytu z DHT11 - sprawdz okablowanie
#include <Arduino.h>
#include <DHT.h>

#define DHT_PIN 23
#define DHT_TYPE DHT11

DHT dht(DHT_PIN, DHT_TYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  Serial.println("DHT11 start");  // parsery pomijają tę linię
}

void loop() {
  delay(2000);  // DHT11 odpowiada max co ~1-2 s

  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t)) {
    Serial.println("Blad odczytu z DHT11 - sprawdz okablowanie");
    return;
  }

  Serial.printf("Temperatura: %.1f C, Wilgotnosc: %.0f %%\n", t, h);
}
