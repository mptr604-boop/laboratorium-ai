// ESP32 + DHT11: odczyt protokołem jednoprzewodowym bez biblioteki DHT.
// Każdy krok ma limit czasu (100 us), więc przy odpiętym czujniku przerwania są wyłączone
// najwyżej kilka ms. Biblioteka DHT czeka na odpowiedź nawet setki ms i budzi watchdog.
// Format linii jest kontraktem z laboratorium-iot i laboratorium-ai:
//   Temperatura: 23.7 C, Wilgotnosc: 42 %
//   Blad odczytu z DHT11 - <powód>
#include <Arduino.h>

#define DHT_PIN 23

// Czeka aż linia przyjmie stan `level`. Zwraca false po przekroczeniu limitu.
static bool waitFor(int level, uint32_t timeoutUs) {
  uint32_t start = micros();
  while (digitalRead(DHT_PIN) != level) {
    if (micros() - start > timeoutUs) return false;
  }
  return true;
}

enum DhtResult { DHT_OK, DHT_NO_RESPONSE, DHT_BAD_CHECKSUM };

static DhtResult readDht11(float &t, float &h) {
  uint8_t data[5] = {0, 0, 0, 0, 0};

  // Sygnał startu: min. 18 ms niskiego stanu, potem puszczamy linię (pull-up).
  pinMode(DHT_PIN, OUTPUT);
  digitalWrite(DHT_PIN, LOW);
  delay(20);
  digitalWrite(DHT_PIN, HIGH);
  delayMicroseconds(30);
  pinMode(DHT_PIN, INPUT_PULLUP);

  bool ok = true;
  noInterrupts();
  // Odpowiedź czujnika: ~80 us LOW, ~80 us HIGH, potem 40 bitów (50 us LOW + 26/70 us HIGH).
  ok = waitFor(LOW, 100) && waitFor(HIGH, 120) && waitFor(LOW, 120);
  for (int i = 0; ok && i < 40; i++) {
    ok = waitFor(HIGH, 100);
    uint32_t rise = micros();
    ok = ok && waitFor(LOW, 120);
    if (ok) data[i / 8] = (data[i / 8] << 1) | ((micros() - rise) > 40 ? 1 : 0);
  }
  interrupts();

  if (!ok) return DHT_NO_RESPONSE;
  if ((uint8_t)(data[0] + data[1] + data[2] + data[3]) != data[4]) return DHT_BAD_CHECKSUM;

  h = data[0];
  t = data[2] + data[3] / 10.0f;
  return DHT_OK;
}

void setup() {
  Serial.begin(115200);
  pinMode(DHT_PIN, INPUT_PULLUP);
  Serial.println("DHT11 start");
}

void loop() {
  delay(2000);  // DHT11 odpowiada max co ~1-2 s

  float t = 0, h = 0;
  DhtResult result = readDht11(t, h);

  if (result == DHT_NO_RESPONSE) {
    Serial.println("Blad odczytu z DHT11 - sprawdz okablowanie");
    return;
  }
  if (result == DHT_BAD_CHECKSUM) {
    Serial.println("Blad odczytu z DHT11 - zla suma kontrolna");
    return;
  }

  Serial.printf("Temperatura: %.1f C, Wilgotnosc: %.0f %%\n", t, h);
}
