const apiHost = process.env.NEXT_PUBLIC_API_HOST || '127.0.0.1';
const apiPort = process.env.NEXT_PUBLIC_API_PORT || '3333';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || `http://${apiHost}:${apiPort}`;
