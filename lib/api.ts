/**
 * URL de l'API backend.
 * - En local : NEXT_PUBLIC_API_URL=http://127.0.0.1:3333 (recommandé)
 * - En production (Vercel/Render) : URL du Web Service Render
 * - Si vide : chemins relatifs /api/... (proxy next.config → BACKEND_URL)
 */
const rawBase = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '') ?? '';

export const API_BASE_URL = rawBase;

/** Construit l'URL d'un endpoint API (ex. apiUrl('/api/salles')). */
export function apiUrl(path: string): string {
  const route = path.startsWith('/') ? path : `/${path}`;
  return rawBase ? `${rawBase}${route}` : route;
}

export type CreatePrescriptionPayload = {
  patientId: string;
  medecinId: string;
  typeExamen: string;
  motif?: string;
  priorite?: string;
  statut?: string;
  dateDemande?: string;
};

/** Soumettre une nouvelle prescription (POST /api/prescriptions). */
export async function createPrescription(payload: CreatePrescriptionPayload) {
  const resp = await fetch(apiUrl('/api/prescriptions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const message = await resp.text();
    throw new Error(message || `Erreur API prescriptions (${resp.status})`);
  }
  return resp.json();
}
