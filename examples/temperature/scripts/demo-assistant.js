// Demo: asystent z atrapą modelu na trzech wzorcach. Uruchom: npm run demo
import { openStore } from '../src/store.js';
import { analyzeDevice } from '../src/assistant/assistant.js';
import { mockModel } from '../src/assistant/mock-model.js';

const OK = { temperature: 21.5, status: 'OK' };
const FAULT = { temperature: null, status: 'DEVICE_FAULT' };
const cases = {
  'błąd co 3. pomiar': Array.from({ length: 24 }, (_, i) => (i % 3 === 2 ? FAULT : OK)),
  'seria błędów na końcu': [...Array(15).fill(OK), ...Array(4).fill(FAULT)],
  'mała próbka': [OK, FAULT],
};

for (const [name, readings] of Object.entries(cases)) {
  const store = openStore();
  readings.forEach(r => store.save(1, r));
  console.log(`\n== ${name}`);
  console.log(await analyzeDevice(1, { store, model: mockModel(1) }));
}
