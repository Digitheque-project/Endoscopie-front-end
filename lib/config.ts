function requireEnv(name: string, value: string | undefined): string {
  const trimmed = value?.trim().replace(/\/$/, '');
  if (!trimmed) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Vérifiez votre .env.local (voir .env.example).`,
    );
  }
  return trimmed;
}

/** API CHU (services, CHU) — Railway */
export const CHU_API_URL = requireEnv('NEXT_PUBLIC_CHU_API_URL', process.env.NEXT_PUBLIC_CHU_API_URL);

/** API Accueil (patients) — Railway */
export const ACCUEIL_API_URL = requireEnv('NEXT_PUBLIC_ACCUEIL_API_URL', process.env.NEXT_PUBLIC_ACCUEIL_API_URL);

/** Service « Endoscopie » — unité paraclinique du CHU */
export const ENDOSCOPIE_SERVICE_ID = requireEnv('NEXT_PUBLIC_ENDOSCOPIE_SERVICE_ID', process.env.NEXT_PUBLIC_ENDOSCOPIE_SERVICE_ID);

/** chuId réel de « CHU Andrainjato Fianarantsoa » côté Service-CHU/Accueil */
export const ENDOSCOPIE_CHU_ID = requireEnv('NEXT_PUBLIC_ENDOSCOPIE_CHU_ID', process.env.NEXT_PUBLIC_ENDOSCOPIE_CHU_ID);
