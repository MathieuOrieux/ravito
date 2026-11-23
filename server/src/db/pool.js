import pg from 'pg';
import { config } from '../config.js';

// Les BIGINT (COUNT(*)) arrivent en chaîne par défaut : on les convertit en nombre.
pg.types.setTypeParser(pg.types.builtins.INT8, (v) => Number(v));
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (v) => Number(v));

export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 });

pool.on('error', (err) => {
  console.error('[db] erreur inattendue sur un client inactif', err);
});

export const query = (text, params) => pool.query(text, params);

/** Exécute `fn(client)` dans une transaction (COMMIT ou ROLLBACK automatique). */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
