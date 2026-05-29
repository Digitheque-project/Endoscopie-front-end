import { CHU_API_URL, ENDOSCOPIE_SERVICE_ID } from './config';

/** Infos du service Endoscopie depuis l'API CHU Railway. */
export async function fetchEndoscopieService() {
  const resp = await fetch(`${CHU_API_URL}/service/${ENDOSCOPIE_SERVICE_ID}`);
  if (!resp.ok) {
    throw new Error(`Service Endoscopie introuvable (${resp.status})`);
  }
  return resp.json() as Promise<{
    serviceId: string;
    name: string;
    description?: string;
    type?: string;
    chuId?: string;
    chu?: { name?: string };
  }>;
}
