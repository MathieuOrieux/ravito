import { z } from 'zod';
import { badRequest } from './errors.js';

/** Valide `data` avec un schéma zod ; lève une 400 lisible en cas d'erreur. */
export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
  throw badRequest(details[0]?.message || 'Données invalides', details);
}

export const idParam = z.object({ id: z.guid({ message: 'Identifiant de trace invalide' }) });
