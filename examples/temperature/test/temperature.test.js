import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFrame } from '../src/parse.js';
import { validateReading } from '../src/contract.js';
import { errorStats } from '../src/stats.js';
import { openStore } from '../src/store.js';

test('parser reads a valid frame', () => {
  assert.deepEqual(parseFrame('TEMP: 23.4 C'), { temperature: 23.4, status: 'OK' });
});

test('parser maps ERR to a device fault with null temperature', () => {
  assert.deepEqual(parseFrame('ERR'), { temperature: null, status: 'DEVICE_FAULT' });
});

test('parser never throws on garbage', () => {
  for (const input of ['', null, undefined, 'TEMP: abc C', '\u0000\u0001', 'TEMP: 1e999 C']) {
    assert.equal(parseFrame(input).status, 'CORRUPTED_TRANSMISSION');
  }
});

test('contract rejects out-of-range temperature and names the field', () => {
  const result = validateReading({ temperature: 900, status: 'OK' });
  assert.equal(result.ok, false);
  assert.match(result.errors[0], /^temperature:/);
});

test('contract requires null temperature on faults', () => {
  assert.equal(validateReading({ temperature: 20, status: 'DEVICE_FAULT' }).ok, false);
  assert.equal(validateReading({ temperature: null, status: 'DEVICE_FAULT' }).ok, true);
});

test('store refuses to save an invalid reading (contract cannot be bypassed)', () => {
  const store = openStore();
  assert.throws(() => store.save(1, { temperature: 900, status: 'OK' }), /contract violation/);
  assert.deepEqual(store.recentStatuses(1, 10), []);
  store.close();
});

test('stats: detects a fault every third reading', () => {
  const statuses = Array.from({ length: 12 }, (_, i) => ((i + 1) % 3 === 0 ? 'DEVICE_FAULT' : 'OK'));
  const stats = errorStats(statuses);
  assert.equal(stats.periodEvery, 3);
  assert.equal(stats.faults, 4);
});

test('stats: reports a current streak and flags too little data', () => {
  const stats = errorStats(['OK', 'DEVICE_FAULT', 'DEVICE_FAULT']);
  assert.equal(stats.currentStreak, 2);
  assert.equal(stats.enoughData, false);
});
