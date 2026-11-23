// Identifiant anonyme du navigateur : un like par trace et par navigateur.
const KEY = 'ravito-voter';
let memory = null;

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  // Repli pour les contextes non sécurisés (http sur IP locale…)
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function getVoterId() {
  if (memory) return memory;
  try {
    memory = localStorage.getItem(KEY);
    if (!memory) {
      memory = uuid();
      localStorage.setItem(KEY, memory);
    }
  } catch {
    memory ||= uuid();
  }
  return memory;
}
