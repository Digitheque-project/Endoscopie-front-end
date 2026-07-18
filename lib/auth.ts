export type AuthServiceClaim = {
  serviceId: string;
  serviceName: string;
  baseUrl: string;
  roleId: string;
  roleName: string;
  permissions: string[];
  chu?: { id: string; name: string };
};

export type AuthJwtPayload = {
  userId: string;
  name: string;
  firstname: string;
  email: string;
  services: AuthServiceClaim[];
  iat: number;
  exp: number;
};

/** Décode le payload d'un JWT sans vérifier la signature (déjà validée par le serveur d'auth à l'émission). */
export function decodeJwt(token: string): AuthJwtPayload | null {
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof window !== 'undefined'
      ? decodeURIComponent(atob(normalized).split('').map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''))
      : Buffer.from(normalized, 'base64').toString('utf-8');
    return JSON.parse(json) as AuthJwtPayload;
  } catch {
    return null;
  }
}
