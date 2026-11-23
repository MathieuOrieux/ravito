// Client HTTP unique : ajoute les en-têtes (visiteur, admin) et normalise les erreurs.
import { getAdminToken } from '../lib/admin.js';
import { getVoterId } from '../lib/voter.js';

const BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(status, message, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function request(path, { method = 'GET', body, query, admin = false } = {}) {
  const url = new URL(BASE + path, window.location.origin);
  for (const [k, v] of Object.entries(query || {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  }

  const headers = { 'X-Voter-Id': getVoterId() };
  if (admin) headers.Authorization = `Bearer ${getAdminToken()}`;
  let payload = body;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, { method, headers, body: payload });
  } catch {
    throw new ApiError(0, "Impossible de joindre le serveur. L'API est-elle lancée ?", 'NETWORK');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error;
    throw new ApiError(res.status, err?.message || `Erreur ${res.status}`, err?.code, err?.details);
  }
  return data;
}

export const gpxDownloadUrl = (id) => `${BASE}/traces/${id}/gpx`;
