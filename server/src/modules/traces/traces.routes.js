import { Router } from 'express';
import multer from 'multer';
import { config } from '../../config.js';
import { badRequest } from '../../lib/errors.js';
import { idParam, parse } from '../../lib/validate.js';
import { requireAdmin } from '../../middleware/auth.js';
import { createTraceSchema, listQuerySchema, updateTraceSchema } from './traces.schemas.js';
import * as service from './traces.service.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (/\.gpx$/i.test(file.originalname)) cb(null, true);
    else cb(badRequest('Seuls les fichiers .gpx sont acceptés'));
  },
});

export const tracesRouter = Router();

// GET /api/traces?q=&activity=&sort=recent|popular|distance|name&limit=&offset=
tracesRouter.get('/', async (req, res) => {
  const filters = parse(listQuerySchema, req.query);
  res.json(await service.listTraces(filters, req.voterId));
});

// GET /api/traces/:id  (avec la géométrie complète)
tracesRouter.get('/:id', async (req, res) => {
  const { id } = parse(idParam, req.params);
  res.json(await service.getTrace(id, req.voterId));
});

// GET /api/traces/:id/gpx  (fichier d'origine)
tracesRouter.get('/:id/gpx', async (req, res) => {
  const { id } = parse(idParam, req.params);
  const { filename, data } = await service.getGpxFile(id);
  res.attachment(filename).type('application/gpx+xml').send(data);
});

// POST /api/traces  (multipart : gpx, name?, description?, activity) — admin
tracesRouter.post('/', requireAdmin, upload.single('gpx'), async (req, res) => {
  if (!req.file) throw badRequest('Fichier GPX manquant (champ « gpx »)');
  const fields = parse(createTraceSchema, req.body ?? {});
  res.status(201).json(await service.createTrace({ file: req.file, fields }, req.voterId));
});

// PATCH /api/traces/:id  (JSON : name?, description?, activity?) — admin
tracesRouter.patch('/:id', requireAdmin, async (req, res) => {
  const { id } = parse(idParam, req.params);
  const fields = parse(updateTraceSchema, req.body ?? {});
  res.json(await service.updateTrace(id, fields, req.voterId));
});

// DELETE /api/traces/:id — admin
tracesRouter.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = parse(idParam, req.params);
  await service.deleteTrace(id);
  res.status(204).end();
});
