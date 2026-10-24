// Parser: surowy tekst z aparatu -> { temperature, status }. Nigdy nie rzuca wyjątku na złych danych.
// Akceptowane: "TEMP: 23.4 C" albo "ERR". Wszystko inne to uszkodzona ramka.
export function parseFrame(raw) {
  const text = String(raw ?? '').trim();

  if (/^err(or)?$/i.test(text)) {
    return { temperature: null, status: 'DEVICE_FAULT' };
  }

  const match = text.match(/^TEMP:\s*(-?\d+(?:\.\d+)?)\s*C$/i);
  if (!match) {
    return { temperature: null, status: 'CORRUPTED_TRANSMISSION' };
  }

  return { temperature: Number(match[1]), status: 'OK' };
}
