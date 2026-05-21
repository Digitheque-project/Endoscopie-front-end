/**
 * URL de base pour les appels API.
 * Par défaut : chemins relatifs (/api/...) proxifiés vers le backend Nest (voir next.config.ts).
 * Pour appeler le backend directement : NEXT_PUBLIC_API_URL=http://127.0.0.1:3333
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
