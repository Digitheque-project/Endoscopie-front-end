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

/**
 * Gateway du service d'authentification centralisé (auth-service + user-service,
 * proxifiés). Point d'entrée unique pour /auth/login, /auth/register, etc.
 */
export const AUTH_GATEWAY_URL =
  process.env.NEXT_PUBLIC_AUTH_GATEWAY_URL?.trim().replace(/\/$/, '') ||
  'https://auth-service-4q6g.onrender.com';

/**
 * serviceId du service « Endoscopie » tel qu'enregistré dans le registre central
 * des services (auth-service / service-service) — distinct de ENDOSCOPIE_SERVICE_ID
 * ci-dessus, qui référence l'API CHU/Accueil (Railway), pas encore synchronisée avec
 * ce registre. Utilisé uniquement pour lire le rôle de l'utilisateur dans le JWT.
 */
export const AUTH_ENDOSCOPIE_SERVICE_ID =
  process.env.NEXT_PUBLIC_AUTH_ENDOSCOPIE_SERVICE_ID?.trim() ||
  'ab97eaaa-9239-4f37-b5d7-d652c4231cc7';

/**
 * Portail de connexion central (auth-client) — seul point d'entrée pour se connecter.
 * Après authentification, l'utilisateur y choisit son service puis est redirigé vers
 * l'URL enregistrée pour « Endoscopie » (baseUrl du service) avec ?accessToken=<JWT>,
 * récupéré automatiquement par AuthGate.
 */
export const AUTH_CLIENT_LOGIN_URL =
  process.env.NEXT_PUBLIC_AUTH_CLIENT_LOGIN_URL?.trim().replace(/\/$/, '') ||
  'https://authentification-front.vercel.app/login';
