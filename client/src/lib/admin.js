// Stockage de la clé admin dans le navigateur.
// À remplacer par une vraie session le jour où l'on ajoute des comptes utilisateurs.
const KEY = 'ravito-admin-token';

export function getAdminToken() {
  try {
    return localStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
}

export function setAdminToken(token) {
  try {
    if (token) localStorage.setItem(KEY, token);
    else localStorage.removeItem(KEY);
  } catch {
    /* stockage indisponible : la clé ne survivra pas au rechargement */
  }
}
