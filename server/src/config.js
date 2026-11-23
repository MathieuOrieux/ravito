// Configuration centralisée, lue depuis les variables d'environnement.
// Toute nouvelle option passe par ici pour rester documentée et validée.

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Variable d'environnement manquante : ${name} (voir server/.env.example)`);
  return value;
}

const env = process.env.NODE_ENV || 'development';
const isTest = env === 'test';
const isProduction = env === 'production';

const adminToken = required('ADMIN_TOKEN');
if (isProduction && adminToken.length < 16) {
  throw new Error('ADMIN_TOKEN trop court pour la production (16 caractères minimum)');
}

export const config = Object.freeze({
  env,
  isTest,
  isProduction,
  port: Number(process.env.PORT) || 3001,
  databaseUrl: isTest ? required('TEST_DATABASE_URL') : required('DATABASE_URL'),
  adminToken,
  corsOrigin: process.env.CORS_ORIGIN || false,
  maxUploadBytes: (Number(process.env.MAX_UPLOAD_MB) || 10) * 1024 * 1024,
  // Applique les migrations au démarrage (pratique en hébergement : rien à lancer à la main)
  migrateOnStart: process.env.MIGRATE_ON_START === 'true',
  // Dossier du front compilé à servir (vide = API seule). Par défaut en production : client/dist
  staticDir: process.env.STATIC_DIR ?? (isProduction ? '../client/dist' : ''),
});
