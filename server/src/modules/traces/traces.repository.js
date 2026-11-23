// Accès SQL aux traces. Seul fichier du module qui parle à la base.
import { query } from '../../db/pool.js';

// Colonnes communes à la liste et au détail (sans la géométrie complète ni le GPX brut).
// $1 est toujours l'identifiant du visiteur (peut être NULL).
const SUMMARY_COLUMNS = `
  t.id, t.name, t.description, t.activity,
  t.distance_m, t.elevation_gain_m, t.elevation_loss_m, t.min_elevation_m, t.max_elevation_m,
  t.preview, t.bbox, t.gpx_filename, t.created_at, t.updated_at,
  (SELECT COUNT(*) FROM trace_likes l WHERE l.trace_id = t.id) AS like_count,
  EXISTS (SELECT 1 FROM trace_likes l WHERE l.trace_id = t.id AND l.voter_id = $1::uuid) AS liked`;

const ORDER_BY = {
  recent: 't.created_at DESC',
  popular: 'like_count DESC, t.created_at DESC',
  distance: 't.distance_m ASC',
  name: 't.name ASC',
};

const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

function buildFilters({ q, activity }, params) {
  const where = [];
  if (q) {
    params.push(`%${escapeLike(q)}%`);
    where.push(`(t.name ILIKE $${params.length} OR t.description ILIKE $${params.length})`);
  }
  if (activity) {
    params.push(activity);
    where.push(`t.activity = $${params.length}`);
  }
  return where.length ? `WHERE ${where.join(' AND ')}` : '';
}

export async function list({ q, activity, sort, limit, offset, voterId }) {
  const params = [voterId];
  const where = buildFilters({ q, activity }, params);
  params.push(limit, offset);

  const [{ rows }, total] = await Promise.all([
    query(
      `SELECT ${SUMMARY_COLUMNS}
         FROM traces t
        ${where}
        ORDER BY ${ORDER_BY[sort]}, t.id
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    ),
    count({ q, activity }),
  ]);
  return { rows, total };
}

async function count(filters) {
  const params = [];
  const where = buildFilters(filters, params);
  const { rows } = await query(`SELECT COUNT(*) AS n FROM traces t ${where}`, params);
  return rows[0].n;
}

export async function findById(id, voterId) {
  const { rows } = await query(`SELECT ${SUMMARY_COLUMNS}, t.geometry FROM traces t WHERE t.id = $2`, [voterId, id]);
  return rows[0] ?? null;
}

export async function findGpx(id) {
  const { rows } = await query('SELECT gpx_filename, gpx_data FROM traces WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function insert(t) {
  const { rows } = await query(
    `INSERT INTO traces (name, description, activity, distance_m, elevation_gain_m, elevation_loss_m,
                         min_elevation_m, max_elevation_m, geometry, preview, bbox, gpx_filename, gpx_data)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING id`,
    [
      t.name, t.description, t.activity, t.distanceM, t.elevationGainM, t.elevationLossM,
      t.minElevationM, t.maxElevationM, JSON.stringify(t.geometry), JSON.stringify(t.preview),
      JSON.stringify(t.bbox), t.gpxFilename, t.gpxData,
    ],
  );
  return rows[0].id;
}

// Liste blanche des colonnes modifiables (protège la construction dynamique du SQL).
const UPDATABLE = { name: 'name', description: 'description', activity: 'activity' };

export async function update(id, fields) {
  const entries = Object.entries(fields).filter(([k, v]) => k in UPDATABLE && v !== undefined);
  const sets = entries.map(([k], i) => `${UPDATABLE[k]} = $${i + 2}`);
  const { rowCount } = await query(`UPDATE traces SET ${sets.join(', ')} WHERE id = $1`, [id, ...entries.map(([, v]) => v)]);
  return rowCount > 0;
}

export async function remove(id) {
  const { rowCount } = await query('DELETE FROM traces WHERE id = $1', [id]);
  return rowCount > 0;
}
