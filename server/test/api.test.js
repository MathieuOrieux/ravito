// Tests d'intégration de l'API sur une vraie base Postgres (TEST_DATABASE_URL).
// La base de test est vidée à chaque exécution : n'utilise jamais ta base principale.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { after, before, beforeEach, describe, test } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.ADMIN_TOKEN ||= 'test-admin-token';

const skip = !process.env.TEST_DATABASE_URL && 'TEST_DATABASE_URL non défini';

describe('API Ravito', { skip }, () => {
  let request, pool, migrate;
  const ADMIN = { Authorization: `Bearer ${process.env.ADMIN_TOKEN}` };
  const voter = randomUUID();
  let gpx;

  before(async () => {
    ({ default: request } = await import('supertest'));
    ({ pool } = await import('../src/db/pool.js'));
    ({ migrate } = await import('../src/db/migrate.js'));
    const { createApp } = await import('../src/app.js');
    const app = createApp();
    request = request.bind(null, app);
    await migrate({ log: () => {} });
    gpx = await readFile(new URL('./fixtures/boucle-exemple.gpx', import.meta.url));
  });

  beforeEach(() => pool.query('TRUNCATE traces CASCADE'));
  after(() => pool?.end());

  const createTrace = (fields = {}) =>
    request()
      .post('/api/traces')
      .set(ADMIN)
      .field('activity', fields.activity ?? 'velo')
      .field('name', fields.name ?? '')
      .field('description', fields.description ?? '')
      .attach('gpx', gpx, 'boucle.gpx');

  test('health', async () => {
    const res = await request().get('/api/health').expect(200);
    assert.equal(res.body.status, 'ok');
  });

  test('création : refusée sans clé admin', async () => {
    const res = await request().post('/api/traces').attach('gpx', gpx, 'b.gpx').field('activity', 'velo').expect(401);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  test('création : valide le fichier et les champs', async () => {
    await request().post('/api/traces').set(ADMIN).field('activity', 'velo').expect(400);
    await request().post('/api/traces').set(ADMIN).field('activity', 'velo').attach('gpx', Buffer.from('<x/>'), 'a.txt').expect(400);
    await request().post('/api/traces').set(ADMIN).field('activity', 'velo').attach('gpx', Buffer.from('<x/>'), 'a.gpx').expect(400);
    const res = await request().post('/api/traces').set(ADMIN).field('activity', 'licorne').attach('gpx', gpx, 'b.gpx').expect(400);
    assert.match(res.body.error.message, /activité/);
  });

  test('CRUD complet', async () => {
    const created = (await createTrace({ description: 'Super boucle' }).expect(201)).body;
    assert.equal(created.name, "Boucle d'exemple (Erdre)"); // repris du GPX
    assert.equal(created.activity, 'velo');
    assert.equal(created.likeCount, 0);
    assert.ok(created.stats.distanceM > 0);
    assert.equal(created.geometry.length, 15);

    const list = (await request().get('/api/traces').expect(200)).body;
    assert.equal(list.total, 1);
    assert.equal(list.items[0].id, created.id);
    assert.equal(list.items[0].geometry, undefined); // pas de géométrie complète dans la liste
    assert.ok(list.items[0].preview.length > 0);

    const updated = (await request().patch(`/api/traces/${created.id}`).set(ADMIN).send({ name: '  Erdre  ', activity: 'gravel' }).expect(200)).body;
    assert.equal(updated.name, 'Erdre');
    assert.equal(updated.activity, 'gravel');
    assert.equal(updated.description, 'Super boucle');

    await request().patch(`/api/traces/${created.id}`).send({ name: 'x' }).expect(401);
    await request().patch(`/api/traces/${created.id}`).set(ADMIN).send({}).expect(400);

    const file = await request().get(`/api/traces/${created.id}/gpx`).expect(200);
    assert.match(file.headers['content-disposition'], /boucle\.gpx/);
    assert.match(file.text, /<gpx/);

    await request().delete(`/api/traces/${created.id}`).set(ADMIN).expect(204);
    await request().get(`/api/traces/${created.id}`).expect(404);
    await request().delete(`/api/traces/${created.id}`).set(ADMIN).expect(404);
  });

  test('identifiant invalide -> 400, inconnu -> 404', async () => {
    await request().get('/api/traces/pas-un-uuid').expect(400);
    await request().get(`/api/traces/${randomUUID()}`).expect(404);
  });

  test('likes : un par visiteur, idempotent, reflété dans la liste', async () => {
    const { id } = (await createTrace().expect(201)).body;
    const url = `/api/traces/${id}/like`;

    await request().put(url).expect(400); // pas d'identifiant visiteur
    let res = await request().put(url).set('X-Voter-Id', voter).expect(200);
    assert.deepEqual(res.body, { likeCount: 1, liked: true });
    res = await request().put(url).set('X-Voter-Id', voter).expect(200);
    assert.deepEqual(res.body, { likeCount: 1, liked: true });
    res = await request().put(url).set('X-Voter-Id', randomUUID()).expect(200);
    assert.deepEqual(res.body, { likeCount: 2, liked: true });

    const mine = (await request().get(`/api/traces/${id}`).set('X-Voter-Id', voter)).body;
    assert.equal(mine.liked, true);
    assert.equal(mine.likeCount, 2);
    const anon = (await request().get('/api/traces')).body.items[0];
    assert.equal(anon.liked, false);

    res = await request().delete(url).set('X-Voter-Id', voter).expect(200);
    assert.deepEqual(res.body, { likeCount: 1, liked: false });

    await request().put(`/api/traces/${randomUUID()}/like`).set('X-Voter-Id', voter).expect(404);
  });

  test('liste : recherche, filtre, tri, pagination', async () => {
    const a = (await createTrace({ name: 'Vallée du Cens', activity: 'velo' })).body;
    await createTrace({ name: 'Forêt du Gâvre', activity: 'vtt' });
    await createTrace({ name: '100% bitume', activity: 'velo' });
    await request().put(`/api/traces/${a.id}/like`).set('X-Voter-Id', voter);

    let res = (await request().get('/api/traces?q=cens')).body;
    assert.deepEqual(res.items.map((t) => t.name), ['Vallée du Cens']);
    res = (await request().get('/api/traces?q=%25')).body; // « % » littéral
    assert.deepEqual(res.items.map((t) => t.name), ['100% bitume']);
    res = (await request().get('/api/traces?activity=vtt')).body;
    assert.equal(res.total, 1);
    res = (await request().get('/api/traces?sort=popular')).body;
    assert.equal(res.items[0].id, a.id);
    res = (await request().get('/api/traces?sort=name&limit=1&offset=1')).body;
    assert.equal(res.total, 3);
    assert.deepEqual(res.items.map((t) => t.name), ['Forêt du Gâvre']);
    await request().get('/api/traces?sort=nope').expect(400);
  });

  test('route inconnue -> 404 JSON', async () => {
    const res = await request().get('/api/nope').expect(404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });
});
