// Parser: surowy tekst z aparatu -> { temperature, status }. Nigdy nie rzuca wyjątku na złych danych.
// Akceptowane: "TEMP: 23.4 C" albo "ERR". Wszystko inne to uszkodzona ramka.
export function parseFrame(raw) {
  const text = String(raw ?? '').trim();

  if (/^err(or)?$/i.test(text)) {
    return { temperature: null, status: 'DEVICE_FAULT' };
  }

  // Szkic ESP32 + DHT11 (examples/esp32-dht11) drukuje błąd własnym tekstem.
  if (/^blad odczytu/i.test(text)) {
    return { temperature: null, status: 'DEVICE_FAULT' };
  }

  // Linia z ESP32 ("Temperatura: 23.7 C, Wilgotnosc: 42 %"): bierzemy temperaturę,
  // wilgotność obsługuje laboratorium-iot, tu nie jest potrzebna.
  const match = text.match(/^(?:TEMP|Temperatura):\s*(-?\d+(?:\.\d+)?)\s*C(?:,\s*Wilgotnosc:\s*\d+(?:\.\d+)?\s*%)?$/i);
  if (!match) {
    return { temperature: null, status: 'CORRUPTED_TRANSMISSION' };
  }

  return { temperature: Number(match[1]), status: 'OK' };
}
