// Logique métier des traces : import GPX, mise en forme des réponses.
import { parseGpx } from '../../lib/gpx.js';
import { notFound } from '../../lib/errors.js';
import * as repo from './traces.repository.js';

/** Ligne SQL -> objet renvoyé par l'API (camelCase, stable pour le front). */
function toDto(row) {
  const dto = {
    id: row.id,
    name: row.name,
    description: row.description,
    activity: row.activity,
    stats: {
      distanceM: row.distance_m,
      elevationGainM: row.elevation_gain_m,
      elevationLossM: row.elevation_loss_m,
      minElevationM: row.min_elevation_m,
      maxElevationM: row.max_elevation_m,
    },
    preview: row.preview,
    bbox: row.bbox,
    gpxFilename: row.gpx_filename,
    likeCount: row.like_count,
    liked: row.liked,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.geometry) dto.geometry = row.geometry;
  return dto;
}

export async function listTraces(filters, voterId) {
  const { rows, total } = await repo.list({ ...filters, voterId });
  return { items: rows.map(toDto), total, limit: filters.limit, offset: filters.offset };
}

export async function getTrace(id, voterId) {
  const row = await repo.findById(id, voterId);
  if (!row) throw notFound('Trace introuvable');
  return toDto(row);
}

export async function createTrace({ file, fields }, voterId) {
  const gpxData = file.buffer.toString('utf8').replace(/^﻿/, '');
  const gpx = parseGpx(gpxData);
  const fallbackName = file.originalname.replace(/\.gpx$/i, '').slice(0, 120);
  const id = await repo.insert({
    name: fields.name || gpx.name.slice(0, 120) || fallbackName,
    description: fields.description,
    activity: fields.activity,
    ...gpx.stats,
    geometry: gpx.points,
    preview: gpx.preview,
    bbox: gpx.bbox,
    gpxFilename: file.originalname,
    gpxData,
  });
  return getTrace(id, voterId);
}

export async function updateTrace(id, fields, voterId) {
  if (!(await repo.update(id, fields))) throw notFound('Trace introuvable');
  return getTrace(id, voterId);
}

export async function deleteTrace(id) {
  if (!(await repo.remove(id))) throw notFound('Trace introuvable');
}

export async function getGpxFile(id) {
  const row = await repo.findGpx(id);
  if (!row) throw notFound('Trace introuvable');
  return { filename: row.gpx_filename, data: row.gpx_data };
}
