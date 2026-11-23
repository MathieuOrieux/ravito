import { query } from '../../db/pool.js';

/** Ajoute le like (idempotent). Renvoie false si la trace n'existe pas. */
export async function like(traceId, voterId) {
  const { rowCount } = await query(
    `INSERT INTO trace_likes (trace_id, voter_id)
     SELECT id, $2 FROM traces WHERE id = $1
     ON CONFLICT (trace_id, voter_id) DO NOTHING`,
    [traceId, voterId],
  );
  return rowCount > 0 || traceExists(traceId);
}

/** Retire le like (idempotent). Renvoie false si la trace n'existe pas. */
export async function unlike(traceId, voterId) {
  await query('DELETE FROM trace_likes WHERE trace_id = $1 AND voter_id = $2', [traceId, voterId]);
  return traceExists(traceId);
}

export async function state(traceId, voterId) {
  const { rows } = await query(
    `SELECT COUNT(*) AS like_count, COALESCE(bool_or(voter_id = $2), false) AS liked
       FROM trace_likes WHERE trace_id = $1`,
    [traceId, voterId],
  );
  return { likeCount: rows[0].like_count, liked: rows[0].liked };
}

async function traceExists(id) {
  const { rowCount } = await query('SELECT 1 FROM traces WHERE id = $1', [id]);
  return rowCount > 0;
}
