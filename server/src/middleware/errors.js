import multer from 'multer';
import { AppError, notFound } from '../lib/errors.js';

export function notFoundHandler(req, _res, next) {
  next(notFound(`Route inconnue : ${req.method} ${req.originalUrl}`));
}

// Format d'erreur unique de l'API : { error: { message, code, details? } }
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = 500;
  let body = { message: 'Erreur interne du serveur', code: 'INTERNAL' };

  if (err instanceof AppError) {
    status = err.status;
    body = { message: err.message, code: err.code, ...(err.details && { details: err.details }) };
  } else if (err instanceof multer.MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    body = { message: err.code === 'LIMIT_FILE_SIZE' ? 'Fichier trop volumineux' : err.message, code: err.code };
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    body = { message: 'JSON invalide', code: 'BAD_JSON' };
  } else if (err.type === 'entity.too.large') {
    status = 413;
    body = { message: 'Requête trop volumineuse', code: 'TOO_LARGE' };
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ error: body });
}
