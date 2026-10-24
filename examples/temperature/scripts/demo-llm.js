// Demo na PRAWDZIWYM modelu (np. lokalna Ollama). Uruchom: npm run demo:llm
// Przykład Ollama: LAB_AI_URL=http://localhost:11434/v1/chat/completions LAB_AI_KEY=ollama LAB_AI_MODEL=qwen2.5:3b
// Błędy modelu (poza schematem, zła nazwa narzędzia) są oczekiwane i pokazywane, nie ukrywane.
import { openStore } from '../src/store.js';
import { analyzeDevice } from '../src/assistant/assistant.js';
import { llmModel } from '../src/assistant/llm-model.js';

const OK = { temperature: 21.5, status: 'OK' };
const FAULT = { temperature: null, status: 'DEVICE_FAULT' };
const cases = {
  'błąd co 3. pomiar': Array.from({ length: 24 }, (_, i) => (i % 3 === 2 ? FAULT : OK)),
  'seria błędów na końcu': [...Array(15).fill(OK), ...Array(4).fill(FAULT)],
  'mała próbka': [OK, FAULT],
  'samo OK': Array(24).fill(OK),
};

for (const [name, readings] of Object.entries(cases)) {
  const store = openStore();
  readings.forEach(r => store.save(1, r));
  console.log(`\n== ${name}`);
  try {
    console.log(await analyzeDevice(1, { store, model: llmModel(), log: (event, data) => console.log(' ', event, JSON.stringify(data)) }));
  } catch (error) {
    console.log('  ODRZUCONE:', error.message);
  }
}
