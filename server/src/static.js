// Sert le front React compilé (client/dist) depuis l'API : un seul service à déployer.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Ajoute à `app` le service des fichiers du front + le repli SPA vers index.html. */
export function serveFrontend(app, staticDir) {
  if (!staticDir) return;
  const dir = path.resolve(serverRoot, staticDir);
  const indexHtml = path.join(dir, 'index.html');
  if (!existsSync(indexHtml)) {
    console.warn(`[static] ${indexHtml} introuvable : lance « npm run build ». Seule l'API est servie.`);
    return;
  }

  // Les fichiers de /assets ont un hash dans leur nom : cache long et immuable.
  app.use('/assets', express.static(path.join(dir, 'assets'), { immutable: true, maxAge: '1y', fallthrough: false }));
  app.use(express.static(dir, { index: false, maxAge: '1h' }));

  // Toute autre page (/traces/…, /admin…) renvoie index.html : React Router prend le relais.
  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.set('Cache-Control', 'no-cache').sendFile('index.html', { root: dir });
  });
}
