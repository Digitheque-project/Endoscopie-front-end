import { ENDOSCOPIE_SERVICE_ID } from './config';

/**
 * URL de l'API clinique endoscopie (NestJS).
 * - Local : NEXT_PUBLIC_API_URL=http://127.0.0.1:3333
 * - Production : URL de votre backend endoscopie (Render, Railway, etc.)
 *
 * L'API CHU (services) est séparée : voir CHU_API_URL dans lib/config.ts
 */
const rawBase =
  process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '') ||
  process.env.BACKEND_URL?.trim().replace(/\/$/, '') ||
  process.env.API_URL?.trim().replace(/\/$/, '') ||
  '';

export const API_BASE_URL = rawBase;

export { ENDOSCOPIE_SERVICE_ID, CHU_API_URL } from './config';

function appendServiceId(url: string): string {
  if (url.includes('serviceId=')) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}serviceId=${encodeURIComponent(ENDOSCOPIE_SERVICE_ID)}`;
}

/** Construit l'URL d'un endpoint API avec le serviceId endoscopie. */
export function apiUrl(path: string): string {
  const route = path.startsWith('/') ? path : `/${path}`;
  // In browser, prefer relative endpoints so Next.js proxy (rewrites)
  // handles requests and avoids CORS issues. On server or when
  // NEXT_PUBLIC_API_URL is explicitly empty, fallback to route.
  const isBrowser = typeof window !== 'undefined';
  const base = isBrowser ? route : (rawBase ? `${rawBase}${route}` : route);
  return appendServiceId(base);
}

/** Ajoute serviceId au corps JSON des requêtes POST/PATCH. */
export function withEndoscopieService<T extends Record<string, unknown>>(
  body: T,
): T & { serviceId: string } {
  return { ...body, serviceId: ENDOSCOPIE_SERVICE_ID };
}

export type CreatePrescriptionPayload = {
  patientId: string;
  medecinId: string;
  typeExamen: string;
  motif?: string;
  priorite?: string;
  statut?: string;
  dateDemande?: string;
  serviceId?: string;
};

export type CreateDossierCpaPayload = {
  patientId: string;
  prescriptionId?: string;
  anesthesisteId?: string;
  typeAnesthesie?: string;
  observations?: string;
  statut?: string;
  serviceId?: string;
};

/** Soumettre une nouvelle prescription (POST /api/prescriptions). */
export async function createPrescription(
  payload: Omit<CreatePrescriptionPayload, 'serviceId'>,
) {
  const resp = await apiFetch('/api/prescriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(withEndoscopieService(payload)),
  });
  if (!resp.ok) {
    const message = await resp.text();
    throw new Error(message || `Erreur API prescriptions (${resp.status})`);
  }
  return resp.json();
}

/** Soumettre une nouvelle demande CPA (POST /api/dossiers-cpa). */
export async function createDossierCpa(
  payload: Omit<CreateDossierCpaPayload, 'serviceId'>,
) {
  const resp = await apiFetch('/api/dossiers-cpa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(withEndoscopieService(payload)),
  });
  if (!resp.ok) {
    const message = await resp.text();
    throw new Error(message || `Erreur API dossiers CPA (${resp.status})`);
  }
  return resp.json();
}

/** Lit le rôle simulé courant (voir contexts/AuthContext.tsx) pour l'envoyer au backend. */
function currentRoleHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = window.localStorage.getItem('current_auth_context');
    if (!saved) return {};
    const { role, medecinId } = JSON.parse(saved) as { role?: string; medecinId?: string };
    const headers: Record<string, string> = {};
    if (role) headers['x-user-role'] = role;
    if (medecinId) headers['x-medecin-id'] = medecinId;
    return headers;
  } catch {
    return {};
  }
}

/** Mettre à jour partiellement un rendez-vous (PATCH /api/rendezvous/:id). */
export async function updateRendezVous(
  id: string,
  payload: {
    typeAnesthesie?: string;
    statut?: string;
    notesCliniques?: string;
    dateHeureDebut?: string;
    dateHeureFin?: string;
  },
) {
  const resp = await apiFetch(`/api/rendezvous/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const text = await resp.text();
    let message = text;
    try {
      message = (JSON.parse(text) as { message?: string }).message || text;
    } catch {
      // texte brut, on le garde tel quel
    }
    throw new Error(message || `Erreur API rendezvous (${resp.status})`);
  }
  return resp.json();
}

/** Appel fetch vers l'API clinique avec serviceId (query + corps JSON). */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const url = apiUrl(path);
  let body = init?.body;

  if (
    body &&
    typeof body === 'string' &&
    method !== 'GET' &&
    method !== 'HEAD'
  ) {
    try {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      body = JSON.stringify(withEndoscopieService(parsed));
    } catch {
      /* corps non-JSON */
    }
  }

  return fetch(url, {
    ...init,
    body,
    headers: { ...currentRoleHeaders(), ...init?.headers },
  });
}

export async function apiJson<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const resp = await apiFetch(path, init);
  const text = await resp.text();

  if (!resp.ok) {
    const errorBody = text.trim() ? text : resp.statusText;
    throw new Error(
      `Erreur API ${resp.status}${errorBody ? `: ${errorBody}` : ''}`,
    );
  }

  if (!text) {
    return null as unknown as T;
  }

  const contentType = resp.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Réponse API invalide JSON: ${text}`);
    }
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Réponse API JSON invalide (${resp.status}): ${text}`);
  }
}
