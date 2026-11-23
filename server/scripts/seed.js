// Insère une trace d'exemple si la base est vide : `npm run db:seed`.
import { readFile } from 'node:fs/promises';
import { pool, query } from '../src/db/pool.js';
import { createTrace } from '../src/modules/traces/traces.service.js';

const { rows } = await query('SELECT COUNT(*) AS n FROM traces');
if (rows[0].n > 0) {
  console.log(`[seed] ${rows[0].n} trace(s) déjà présente(s), rien à faire.`);
} else {
  const buffer = await readFile(new URL('./boucle-exemple.gpx', import.meta.url));
  const trace = await createTrace({
    file: { buffer, originalname: 'boucle-exemple.gpx' },
    fields: {
      activity: 'velo',
      description: 'Trace fictive pour tester le site. À remplacer par les vraies traces du dimanche.',
    },
  });
  console.log(`[seed] trace d'exemple créée : ${trace.name} (${trace.id})`);
}
await pool.end();
