import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import { query } from './db/pool.js';
import { ACTIVITIES } from './lib/activities.js';
import { requireAdmin } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import { readVoter } from './middleware/voter.js';
import { likesRouter } from './modules/likes/likes.routes.js';
import { tracesRouter } from './modules/traces/traces.routes.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  if (config.corsOrigin) app.use(cors({ origin: config.corsOrigin.split(',').map((s) => s.trim()) }));
  if (!config.isTest) app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '100kb' }));
  app.use(readVoter);

  const api = express.Router();

  api.get('/health', async (_req, res) => {
    await query('SELECT 1');
    res.json({ status: 'ok' });
  });
  api.get('/meta', (_req, res) => res.json({ activities: ACTIVITIES }));
  // Permet au front de vérifier une clé admin avant de l'enregistrer.
  api.get('/auth/check', requireAdmin, (_req, res) => res.status(204).end());

  api.use('/traces/:id/like', likesRouter);
  api.use('/traces', tracesRouter);

  app.use('/api', api);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
