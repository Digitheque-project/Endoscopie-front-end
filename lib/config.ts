/** API CHU (services, CHU) — Railway */
export const CHU_API_URL = (
  process.env.NEXT_PUBLIC_CHU_API_URL?.trim().replace(/\/$/, '') ||
  'https://service-chu-back-production-77d5.up.railway.app'
);

/** Service « Endoscopie » — unité paraclinique du CHU */
export const ENDOSCOPIE_SERVICE_ID =
  process.env.NEXT_PUBLIC_ENDOSCOPIE_SERVICE_ID?.trim() ||
  '38f39d38-152e-495b-8c48-28937750d9eb';
