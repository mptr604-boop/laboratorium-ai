import { DatabaseSync } from 'node:sqlite';
import { validateReading } from './contract.js';

// WAL: zapis idzie najpierw do dziennika, więc awaria w trakcie nie zostawia uszkodzonej bazy.
export function openStore(file = ':memory:') {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec(`CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,
    temperature REAL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec('CREATE INDEX IF NOT EXISTS idx_readings_device ON readings (device_id, id)');

  const insert = db.prepare('INSERT INTO readings (device_id, temperature, status) VALUES (?, ?, ?)');
  const recent = db.prepare('SELECT status FROM readings WHERE device_id = ? ORDER BY id DESC LIMIT ?');

  return {
    // Kontrakt jest sprawdzany tutaj, więc nie da się go ominąć żadną ścieżką wejścia.
    save(deviceId, reading) {
      const result = validateReading(reading);
      if (!result.ok) {
        const error = new Error('contract violation');
        error.details = result.errors;
        throw error;
      }
      insert.run(deviceId, reading.temperature, reading.status);
    },
    recentStatuses(deviceId, limit) {
      return recent.all(deviceId, limit).map(row => row.status).reverse();
    },
    close: () => db.close(),
  };
}
