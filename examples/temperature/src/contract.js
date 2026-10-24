// Kontrakt: jedno źródło prawdy o tym, jak wygląda poprawny odczyt. Czytaj jako dokumentację.
// Zakres -50..100 °C to założenie przykładu; w prawdziwym labo potwierdza go ktoś, kto zna aparat.
export const STATUSES = ['OK', 'DEVICE_FAULT', 'CORRUPTED_TRANSMISSION'];
export const TEMPERATURE_RANGE = { min: -50, max: 100 };

export const contract = {
  temperature: 'number w zakresie -50..100 (wymagane przy statusie OK), null przy awarii',
  status: `jeden z: ${STATUSES.join(', ')}`,
};

export function validateReading(reading) {
  const errors = [];

  if (!reading || typeof reading !== 'object') {
    return { ok: false, errors: ['reading must be an object'] };
  }
  if (!STATUSES.includes(reading.status)) {
    errors.push(`status: unknown value "${reading.status}"`);
  }

  const { temperature, status } = reading;
  if (status === 'OK') {
    const inRange = Number.isFinite(temperature)
      && temperature >= TEMPERATURE_RANGE.min && temperature <= TEMPERATURE_RANGE.max;
    if (!inRange) errors.push(`temperature: must be a number in ${TEMPERATURE_RANGE.min}..${TEMPERATURE_RANGE.max}`);
  } else if (temperature !== null) {
    errors.push('temperature: must be null when status is not OK');
  }

  return { ok: errors.length === 0, errors };
}
