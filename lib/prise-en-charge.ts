import { CHU_API_URL } from "./config";

export interface PriseEnCharge {
  id: string;
  nom: string;
}

interface ChuPriseEnChargeRaw {
  id: string;
  companyName: string;
}

/** Jeton SSO de l'utilisateur connecté (voir contexts/AuthContext.tsx) — le service CHU
 * exige une authentification, on réutilise directement la session en cours plutôt que
 * de passer par notre propre backend. */
function currentUserToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem("current_auth_context");
    if (!saved) return null;
    const { accessToken } = JSON.parse(saved) as { accessToken?: string };
    return accessToken || null;
  } catch {
    return null;
  }
}

/** Cache mémoire propre à la session du navigateur (vidé au rechargement de la page) —
 * évite de refaire le même appel réseau pour un même id affiché plusieurs fois sur une
 * page (ex. plusieurs prescriptions du même patient dans le Fil). Jamais persisté. */
const cache = new Map<string, PriseEnCharge | null>();

/**
 * Récupère une prise en charge (entreprise partenaire) directement depuis le service
 * CHU externe, en utilisant le jeton de l'utilisateur SSO actuellement connecté. Renvoie
 * `null` en cas d'échec (pas de token, service indisponible, id introuvable, etc.) plutôt
 * que de lever une exception — l'affichage de la prise en charge ne doit jamais faire
 * échouer l'affichage du patient lui-même.
 */
export async function fetchPriseEnCharge(id: string): Promise<PriseEnCharge | null> {
  if (cache.has(id)) return cache.get(id)!;

  const token = currentUserToken();
  if (!token) return null;

  try {
    const res = await fetch(`${CHU_API_URL}/prise-en-charge/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      cache.set(id, null);
      return null;
    }
    const data = (await res.json()) as ChuPriseEnChargeRaw;
    const result: PriseEnCharge = { id: data.id, nom: data.companyName };
    cache.set(id, result);
    return result;
  } catch {
    cache.set(id, null);
    return null;
  }
}
