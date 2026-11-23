import { z } from 'zod';
import { badRequest } from '../lib/errors.js';

const voterSchema = z.guid();

/**
 * Lit l'identifiant anonyme du visiteur (en-tête `X-Voter-Id`, UUID généré par le navigateur).
 * Facultatif pour la lecture (sert à savoir « ai-je liké ? »), obligatoire pour liker.
 */
export function readVoter(req, _res, next) {
  const raw = req.get('x-voter-id');
  req.voterId = raw && voterSchema.safeParse(raw).success ? raw.toLowerCase() : null;
  next();
}

export function requireVoter(req, _res, next) {
  if (!req.voterId) return next(badRequest('En-tête X-Voter-Id manquant ou invalide'));
  next();
}
