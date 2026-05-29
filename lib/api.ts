import { ENDOSCOPIE_SERVICE_ID } from './config';

/**
 * URL de l'API clinique endoscopie (NestJS).
 * - Local : NEXT_PUBLIC_API_URL=http://127.0.0.1:3333
 * - Production : URL de votre backend endoscopie (Render, Railway, etc.)
 *
 * L'API CHU (services) est séparée : voir CHU_API_URL dans lib/config.ts
 */
const rawBase = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '') ?? '';

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
  const base = rawBase ? `${rawBase}${route}` : route;
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

  return fetch(url, { ...init, body });
}
