import { z } from 'zod';
import { ACTIVITIES } from '../../lib/activities.js';

const name = z.string().trim().min(1, 'Le nom est obligatoire').max(120, 'Nom trop long (120 caractères max)');
const description = z.string().trim().max(2000, 'Description trop longue (2000 caractères max)');
const activity = z.enum(ACTIVITIES, { message: "Type d'activité inconnu" });

// Création : multipart/form-data (fichier `gpx` + champs texte). Le nom est
// facultatif : à défaut on reprend celui contenu dans le GPX.
export const createTraceSchema = z.object({
  name: z.string().trim().max(120, 'Nom trop long (120 caractères max)').optional(),
  description: description.default(''),
  activity,
});

export const updateTraceSchema = z
  .object({ name, description, activity })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Aucun champ à modifier' });

export const SORTS = ['recent', 'popular', 'distance', 'name'];

export const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  activity: activity.optional(),
  sort: z.enum(SORTS).default('recent'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
