import { Router } from 'express';
import { notFound } from '../../lib/errors.js';
import { idParam, parse } from '../../lib/validate.js';
import { requireVoter } from '../../middleware/voter.js';
import * as repo from './likes.repository.js';

// Monté sous /api/traces/:id/like (mergeParams pour récupérer :id).
export const likesRouter = Router({ mergeParams: true });

likesRouter.use(requireVoter);

// PUT /api/traces/:id/like — liker (idempotent)
likesRouter.put('/', async (req, res) => {
  const { id } = parse(idParam, req.params);
  if (!(await repo.like(id, req.voterId))) throw notFound('Trace introuvable');
  res.json(await repo.state(id, req.voterId));
});

// DELETE /api/traces/:id/like — retirer son like (idempotent)
likesRouter.delete('/', async (req, res) => {
  const { id } = parse(idParam, req.params);
  if (!(await repo.unlike(id, req.voterId))) throw notFound('Trace introuvable');
  res.json(await repo.state(id, req.voterId));
});
