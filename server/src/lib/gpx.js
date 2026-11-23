// Lecture d'un fichier GPX : points, distance, dénivelé, emprise.
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { badRequest } from './errors.js';

/** Au-delà, la géométrie stockée pour l'affichage est sous-échantillonnée. */
const MAX_DISPLAY_POINTS = 2000;
/** Nombre de points de l'aperçu (vignettes, carte d'ensemble). */
const MAX_PREVIEW_POINTS = 150;
/** Variation minimale (m) pour compter du dénivelé : filtre le bruit GPS/altimètre. */
const ELEVATION_THRESHOLD_M = 2;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  removeNSPrefix: true,
  parseTagValue: false,
  processEntities: false,
  isArray: (name) => ['trk', 'trkseg', 'trkpt', 'rte', 'rtept'].includes(name),
});

const asArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const text = (v) => (v == null ? '' : typeof v === 'object' ? String(v['#text'] ?? '') : String(v)).trim();

/**
 * @param {string} xml contenu du fichier .gpx
 * @returns {{ name: string, points: [number, number, number|null][], preview: [number, number][], stats: object, bbox: number[][] }}
 */
export function parseGpx(xml) {
  if (typeof xml !== 'string' || !xml.trim()) throw badRequest('Fichier GPX vide');
  if (XMLValidator.validate(xml) !== true) throw badRequest('Fichier GPX illisible (XML invalide)');

  const gpx = parser.parse(xml).gpx;
  if (!gpx) throw badRequest("Ce fichier n'est pas un GPX (balise <gpx> absente)");

  const trackPoints = asArray(gpx.trk).flatMap((t) => asArray(t.trkseg).flatMap((s) => asArray(s.trkpt)));
  const rawPoints = trackPoints.length ? trackPoints : asArray(gpx.rte).flatMap((r) => asArray(r.rtept));

  const points = [];
  for (const p of rawPoints) {
    const lat = Number.parseFloat(p.lat);
    const lon = Number.parseFloat(p.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    const eleRaw = Number.parseFloat(text(p.ele));
    points.push([round(lat, 6), round(lon, 6), Number.isFinite(eleRaw) ? round(eleRaw, 1) : null]);
  }
  if (points.length < 2) throw badRequest('Le GPX doit contenir au moins 2 points de trace');

  const name = text(gpx.metadata?.name) || text(asArray(gpx.trk)[0]?.name) || text(asArray(gpx.rte)[0]?.name);

  return {
    name,
    points: downsample(points, MAX_DISPLAY_POINTS),
    preview: downsample(points, MAX_PREVIEW_POINTS).map(([lat, lon]) => [lat, lon]),
    stats: computeStats(points),
    bbox: bbox(points),
  };
}

export function computeStats(points) {
  let distance = 0;
  let gain = 0;
  let loss = 0;
  let min = Infinity;
  let max = -Infinity;
  let ref = null; // dernière altitude « retenue » (hystérésis)

  for (let i = 0; i < points.length; i++) {
    if (i > 0) distance += haversine(points[i - 1], points[i]);
    const ele = points[i][2];
    if (ele == null) continue;
    min = Math.min(min, ele);
    max = Math.max(max, ele);
    if (ref == null) ref = ele;
    else if (Math.abs(ele - ref) >= ELEVATION_THRESHOLD_M) {
      if (ele > ref) gain += ele - ref;
      else loss += ref - ele;
      ref = ele;
    }
  }

  return {
    distanceM: Math.round(distance),
    elevationGainM: Math.round(gain),
    elevationLossM: Math.round(loss),
    minElevationM: Number.isFinite(min) ? Math.round(min) : null,
    maxElevationM: Number.isFinite(max) ? Math.round(max) : null,
  };
}

/** Distance en mètres entre deux points [lat, lon]. */
export function haversine([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function bbox(points) {
  let [minLat, minLon, maxLat, maxLon] = [90, 180, -90, -180];
  for (const [lat, lon] of points) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
  }
  return [[minLat, minLon], [maxLat, maxLon]];
}

function downsample(points, max) {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => points[Math.round(i * step)]);
}

function round(n, digits) {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
