/** API CHU (services, CHU) — Railway */
export const CHU_API_URL = (
  process.env.NEXT_PUBLIC_CHU_API_URL?.trim().replace(/\/$/, '') ||
  'https://service-chu-back-production-d6a8.up.railway.app'
);

/** API Accueil (patients) — Railway */
export const ACCUEIL_API_URL = (
  process.env.NEXT_PUBLIC_ACCUEIL_API_URL?.trim().replace(/\/$/, '') ||
  'https://acceuil-back-production.up.railway.app'
);

/** Service « Endoscopie » — unité paraclinique du CHU */
export const ENDOSCOPIE_SERVICE_ID =
  process.env.NEXT_PUBLIC_ENDOSCOPIE_SERVICE_ID?.trim() ||
  '38f39d38-152e-495b-8c48-28937750d9eb';

/** chuId réel de « CHU Andrainjato Fianarantsoa » côté Service-CHU/Accueil */
export const ENDOSCOPIE_CHU_ID =
  process.env.NEXT_PUBLIC_ENDOSCOPIE_CHU_ID?.trim() ||
  '72d49761-2a65-446d-b025-15a74cac1ad4';
