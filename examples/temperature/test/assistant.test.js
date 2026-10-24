import test from 'node:test';
import assert from 'node:assert/strict';
import { openStore } from '../src/store.js';
import { analyzeDevice, AssistantError } from '../src/assistant/assistant.js';
import { mockModel } from '../src/assistant/mock-model.js';
import { llmModel } from '../src/assistant/llm-model.js';
import { createTools } from '../src/assistant/tools.js';

const OK = { temperature: 21.5, status: 'OK' };
const FAULT = { temperature: null, status: 'DEVICE_FAULT' };

function storeWith(pattern, deviceId = 1) {
  const store = openStore();
  for (const r of pattern) store.save(deviceId, r);
  return store;
}
const run = (store, model = mockModel(1)) => analyzeDevice(1, { store, model });
const repeat = (r, n) => Array.from({ length: n }, () => r);

// Zestaw ewaluacyjny: przypadki z docs/USTALENIA.md, sekcja 6.
test('eval: błąd co 3. pomiar -> wzorzec cykliczny', async () => {
  const pattern = Array.from({ length: 24 }, (_, i) => (i % 3 === 2 ? FAULT : OK));
  const result = await run(storeWith(pattern));
  assert.equal(result.verdict, 'anomaly');
  assert.match(result.hypothesis, /cykliczn/);
});

test('eval: seria błędów na końcu -> hipoteza o aparacie', async () => {
  const result = await run(storeWith([...repeat(OK, 15), ...repeat(FAULT, 4)]));
  assert.equal(result.verdict, 'anomaly');
  assert.match(result.hypothesis, /aparatu/);
});

test('eval: mała próbka -> za mało danych', async () => {
  const result = await run(storeWith([OK, FAULT, FAULT]));
  assert.equal(result.verdict, 'insufficient_data');
});

test('eval: brak anomalii -> brak fałszywego alarmu', async () => {
  const result = await run(storeWith(repeat(OK, 30)));
  assert.equal(result.verdict, 'no_anomaly');
});

test('każda odpowiedź ma etykietę hipoteza, nie diagnoza', async () => {
  const result = await run(storeWith(repeat(OK, 12)));
  assert.equal(result.disclaimer, 'hipoteza, nie diagnoza');
});

// Strażnicy: sprawdzają otoczkę, a nie model.
test('narzędzia są tylko do odczytu', () => {
  const names = Object.keys(createTools(storeWith([])));
  assert.deepEqual(names.sort(), ['describe_contract', 'get_error_stats', 'get_recent_measurements']);
  assert.ok(!names.some(n => /save|write|delete|update|insert/.test(n)));
});

test('injection: model "posłuszny" wstrzykniętej instrukcji nie dostaje narzędzia zapisu', async () => {
  const store = storeWith(repeat(OK, 12));
  const obeying = async () => ({ tool: 'delete_all_readings', args: {} });
  await assert.rejects(analyzeDevice(1, { store, model: obeying }), /unknown tool/);
  assert.equal(store.recentStatuses(1, 100).length, 12);
});

test('odpowiedź poza schematem jest odrzucana', async () => {
  const store = storeWith(repeat(OK, 12));
  const bad = async () => ({ final: { verdict: 'anomaly', hypothesis: 'tak' } });
  await assert.rejects(analyzeDevice(1, { store, model: bad }), AssistantError);
});

test('brak etykiety hipoteza, nie diagnoza -> odrzucone', async () => {
  const store = storeWith(repeat(OK, 12));
  const noLabel = async () => ({ final: { verdict: 'no_anomaly', hypothesis: 'ok', evidence: ['x'], confidence: 'high', nextSteps: [], disclaimer: 'pewna diagnoza' } });
  await assert.rejects(analyzeDevice(1, { store, model: noLabel }), AssistantError);
});

test('małą próbkę kod nie pozwala ogłosić jako anomalię', async () => {
  const store = storeWith([FAULT, FAULT, FAULT]);
  const overconfident = async messages => (messages.some(m => m.role === 'tool')
    ? { final: { verdict: 'anomaly', hypothesis: 'awaria', evidence: ['błędy'], confidence: 'high', nextSteps: [], disclaimer: 'hipoteza, nie diagnoza' } }
    : { tool: 'get_error_stats', args: { device_id: 1 } });
  await assert.rejects(analyzeDevice(1, { store, model: overconfident }), /contradicts sample size/);
});

test('model w pętli bez końca jest zatrzymany', async () => {
  const store = storeWith(repeat(OK, 12));
  const looping = async () => ({ tool: 'describe_contract', args: {} });
  await assert.rejects(analyzeDevice(1, { store, model: looping }), /too many steps/);
});

test('błędne argumenty narzędzia są odrzucane', async () => {
  const store = storeWith(repeat(OK, 12));
  const bad = async () => ({ tool: 'get_error_stats', args: { device_id: -5, window: 99999 } });
  await assert.rejects(analyzeDevice(1, { store, model: bad }), /bad args/);
});

test('dane z narzędzi są oznaczone jako niezaufane i nie trafiają do promptu systemowego', async () => {
  const store = storeWith(repeat(OK, 12));
  let seen;
  const spy = async messages => {
    seen = messages;
    return messages.some(m => m.role === 'tool')
      ? mockModel(1)(messages)
      : { tool: 'get_error_stats', args: { device_id: 1 } };
  };
  await run(store, spy);
  const toolMsg = seen.find(m => m.role === 'tool');
  assert.equal(toolMsg.untrusted, true);
  assert.ok(!seen.find(m => m.role === 'system').content.includes(toolMsg.content));
});

test('adapter prawdziwego modelu wymaga klucza i nie ujawnia go w treści zapytania', async () => {
  assert.throws(() => llmModel({ apiKey: '', model: 'm' }), /LAB_AI_KEY/);
  let request;
  const model = llmModel({
    apiKey: 'sekret-123', model: 'm', url: 'http://x',
    fetchImpl: async (url, init) => { request = init; return { ok: true, json: async () => ({ choices: [{ message: { content: '{"tool":"describe_contract"}' } }] }) }; },
  });
  const turn = await model([{ role: 'system', content: 's' }, { role: 'tool', name: 'get_error_stats', content: '{}' }]);
  assert.deepEqual(turn, { tool: 'describe_contract' });
  assert.ok(!request.body.includes('sekret-123'));
  assert.match(request.body, /niezaufane/);
});
