import { createApp } from './app.js';
import { config } from './config.js';
import { pool } from './db/pool.js';

const server = createApp().listen(config.port, () => {
  console.log(`[api] Ravito API sur http://localhost:${config.port}/api`);
});

function shutdown(signal) {
  console.log(`[api] ${signal} reçu, arrêt…`);
  server.close(() => pool.end().finally(() => process.exit(0)));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
