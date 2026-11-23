// Configuration centralisée, lue depuis les variables d'environnement.
// Toute nouvelle option passe par ici pour rester documentée et validée.

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Variable d'environnement manquante : ${name} (voir server/.env.example)`);
  return value;
}

const isTest = process.env.NODE_ENV === 'test';

export const config = Object.freeze({
  env: process.env.NODE_ENV || 'development',
  isTest,
  port: Number(process.env.PORT) || 3001,
  databaseUrl: isTest ? required('TEST_DATABASE_URL') : required('DATABASE_URL'),
  adminToken: required('ADMIN_TOKEN'),
  corsOrigin: process.env.CORS_ORIGIN || false,
  maxUploadBytes: (Number(process.env.MAX_UPLOAD_MB) || 10) * 1024 * 1024,
});
