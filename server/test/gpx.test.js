import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { computeStats, haversine, parseGpx } from '../src/lib/gpx.js';

const sample = await readFile(new URL('./fixtures/boucle-exemple.gpx', import.meta.url), 'utf8');

test('parseGpx lit les points, le nom et calcule les stats', () => {
  const gpx = parseGpx(sample);
  assert.equal(gpx.name, "Boucle d'exemple (Erdre)");
  assert.equal(gpx.points.length, 15);
  assert.deepEqual(gpx.points[0], [47.2232, -1.5523, 12]);
  assert.ok(gpx.stats.distanceM > 20000 && gpx.stats.distanceM < 30000, `distance ${gpx.stats.distanceM}`);
  assert.equal(gpx.stats.minElevationM, 12);
  assert.equal(gpx.stats.maxElevationM, 45);
  assert.ok(gpx.stats.elevationGainM > 0);
  assert.deepEqual(gpx.bbox, [[47.2232, -1.5523], [47.312, -1.49]]);
  assert.ok(gpx.preview.length <= 150);
});

test('parseGpx accepte les routes (rtept) sans altitude', () => {
  const xml = `<?xml version="1.0"?><gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
    <rte><name>R</name><rtept lat="45" lon="5"/><rtept lat="45.01" lon="5"/></rte></gpx>`;
  const gpx = parseGpx(xml);
  assert.equal(gpx.points.length, 2);
  assert.equal(gpx.points[0][2], null);
  assert.equal(gpx.stats.elevationGainM, 0);
  assert.equal(gpx.stats.minElevationM, null);
  assert.ok(Math.abs(gpx.stats.distanceM - 1112) < 5);
});

test('parseGpx rejette les fichiers invalides', () => {
  assert.throws(() => parseGpx(''), /vide/);
  assert.throws(() => parseGpx('<gpx><trk>'), /XML invalide/);
  assert.throws(() => parseGpx('<kml></kml>'), /pas un GPX/);
  assert.throws(() => parseGpx('<gpx><trk><trkseg><trkpt lat="1" lon="1"/></trkseg></trk></gpx>'), /au moins 2 points/);
});

test('computeStats ignore le bruit inférieur au seuil', () => {
  const pts = [[0, 0, 100], [0, 0.0001, 101], [0, 0.0002, 100], [0, 0.0003, 101], [0, 0.0004, 110]];
  const s = computeStats(pts);
  assert.equal(s.elevationGainM, 10);
  assert.equal(s.elevationLossM, 0);
});

test('haversine', () => {
  assert.ok(Math.abs(haversine([0, 0], [0, 1]) - 111195) < 1);
});
