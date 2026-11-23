import { timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';
import { unauthorized } from '../lib/errors.js';

const expected = Buffer.from(config.adminToken);

function isAdminToken(token) {
  const given = Buffer.from(token || '');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Protège une route par la clé admin (`Authorization: Bearer <ADMIN_TOKEN>`).
 * Point unique à remplacer le jour où l'on passe à de vrais comptes utilisateurs.
 */
export function requireAdmin(req, _res, next) {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !isAdminToken(token)) return next(unauthorized('Clé admin invalide'));
  req.isAdmin = true;
  next();
}
