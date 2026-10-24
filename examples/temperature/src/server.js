import http from 'node:http';
import { parseFrame } from './parse.js';
import { openStore } from './store.js';
import { errorStats } from './stats.js';

// Jedna linia JSON na zdarzenie, żeby szybko znaleźć problem w logach.
const log = (event, fields = {}) =>
  process.stdout.write(`${JSON.stringify({ time: new Date().toISOString(), event, ...fields })}\n`);

export function createServer(store) {
  return http.createServer((req, res) => {
    const send = (code, body) => {
      res.writeHead(code, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    const url = new URL(req.url, 'http://localhost');
    const match = url.pathname.match(/^\/devices\/(\d+)\/(readings|stats)$/);
    if (!match) return send(404, { error: 'not found' });
    const deviceId = Number(match[1]);

    if (req.method === 'GET' && match[2] === 'stats') {
      return send(200, errorStats(store.recentStatuses(deviceId, 50)));
    }

    if (req.method === 'POST' && match[2] === 'readings') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 1024) { send(413, { error: 'payload too large' }); req.destroy(); }
      });
      req.on('end', () => {
        const reading = parseFrame(body);
        try {
          store.save(deviceId, reading);
          log('reading.saved', { deviceId, status: reading.status });
          send(201, reading);
        } catch (error) {
          log('reading.rejected', { deviceId, reason: error.message, details: error.details });
          send(422, { error: error.message, details: error.details });
        }
      });
      return undefined;
    }

    return send(405, { error: 'method not allowed' });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const store = openStore(process.env.DB_FILE ?? 'temperature.sqlite');
  createServer(store).listen(Number(process.env.PORT ?? 3000), () => log('server.started'));
}
