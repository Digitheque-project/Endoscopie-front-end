function requireEnv(name: string, value: string | undefined): string {
  const trimmed = value?.trim().replace(/\/$/, '');
  if (!trimmed) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Vérifiez votre .env.local (voir .env.example).`,
    );
  }
  return trimmed;
}

/**
 * Passerelle unique du CHU (auth, users, services, chu, accueil, notification,
 * prise en charge...), chaque service sous son propre préfixe de chemin.
 */
export const GATEWAY_URL = requireEnv('NEXT_PUBLIC_GATEWAY_URL', process.env.NEXT_PUBLIC_GATEWAY_URL);

/** Page de connexion centrale (portail d'authentification). */
export const AUTH_CLIENT_LOGIN_URL = requireEnv(
  'NEXT_PUBLIC_AUTH_CLIENT_LOGIN_URL',
  process.env.NEXT_PUBLIC_AUTH_CLIENT_LOGIN_URL,
);

/**
 * Identifiant du service « Endoscopie » de l'utilisateur connecté, lu dans son jeton
 * (entrée services[] nommée Endoscopie) — jamais figé en variable d'environnement :
 * le même front sert l'Endoscopie de n'importe quel CHU. Chaîne vide hors session ;
 * le backend retombe alors sur sa propre identité, résolue par nom.
 */
export function endoscopieServiceId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const saved = window.localStorage.getItem('current_auth_context');
    const token = saved ? (JSON.parse(saved) as { accessToken?: string }).accessToken : undefined;
    if (!token) return '';
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(b64)) as {
      services?: Array<{ serviceId?: string; serviceName?: string }>;
    };
    return payload.services?.find((s) => /endoscop/i.test(s.serviceName ?? ''))?.serviceId ?? '';
  } catch {
    return '';
  }
}
