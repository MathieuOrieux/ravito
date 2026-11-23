/** Erreur métier renvoyée telle quelle au client, avec un code HTTP. */
export class AppError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details) => new AppError(400, message, { code: 'BAD_REQUEST', details });
export const unauthorized = (message = 'Authentification requise') => new AppError(401, message, { code: 'UNAUTHORIZED' });
export const notFound = (message = 'Ressource introuvable') => new AppError(404, message, { code: 'NOT_FOUND' });
