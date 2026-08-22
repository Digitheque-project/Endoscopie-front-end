import { apiUrl, currentRoleHeaders } from './api';
import { ENDOSCOPIE_SERVICE_ID } from './config';

const NOTIFICATION_API_URL =
  process.env.NEXT_PUBLIC_NOTIFICATION_API_URL?.trim().replace(/\/$/, '') ||
  'https://gateway-bwm4.onrender.com';

export type NotificationItem = {
  id?: string;
  type?: string;
  motif?: string;
  urgence?: number;
  status?: string;
  createdAt?: string;
  patientId?: string;
  emitterName?: string;
  recipientName?: string;
  readAt?: string | null;
  serviceId?: string;
  entiteRefType?: string;
  entiteRefId?: string;
};

type RawNotification = Record<string, unknown>;

type NotificationListResponse = {
  serviceId?: string;
  status?: string;
  total?: number;
  items?: RawNotification[];
};

function normalizeNotification(raw: RawNotification): NotificationItem {
  // Le service notification renvoie le détail métier dans `data` (pas `payload`), et le
  // texte lui-même dans `message` au niveau racine — `motif` n'existe qu'en repli, imbriqué
  // dans `data.motif` pour les notifications émises par notre propre backend.
  const payload = (raw.data ?? raw.payload) as Record<string, unknown> | undefined;
  return {
    id: (raw.id as string) ?? undefined,
    type: (raw.type as string) ?? undefined,
    motif:
      (raw.motif as string) ??
      (payload?.motif as string) ??
      (raw.message as string) ??
      undefined,
    urgence: typeof raw.urgence === 'number' ? raw.urgence : undefined,
    status: (raw.statut as string) ?? (raw.status as string) ?? undefined,
    createdAt:
      (raw.created_at as string) ?? (raw.createdAt as string) ?? undefined,
    patientId: (raw.patientId as string) ?? undefined,
    emitterName:
      (raw.emetteur_name as string) ?? (raw.emitterName as string) ?? undefined,
    recipientName:
      (raw.destinataire_name as string) ??
      (raw.recipientName as string) ??
      undefined,
    readAt: (raw.lu_at as string | null) ?? (raw.readAt as string | null) ?? null,
    serviceId:
      (payload?.sourceServiceId as string) ??
      (raw.emitter as string) ??
      ENDOSCOPIE_SERVICE_ID,
    // Même repli que motif ci-dessus : ces deux champs sont nichés dans `data` pour les
    // notifications émises par notre propre backend (voir NotificationService.createNotification),
    // jamais à la racine — sans ce repli, le clic sur la notification n'avait aucun effet
    // (silencieux : les conditions de navigation ne correspondaient jamais).
    entiteRefType: (raw.entiteRefType as string) ?? (payload?.entiteRefType as string) ?? undefined,
    entiteRefId: (raw.entiteRefId as string) ?? (payload?.entiteRefId as string) ?? undefined,
  };
}

function parseItems(data: unknown): RawNotification[] {
  if (Array.isArray(data)) return data as RawNotification[];
  const wrapped = data as NotificationListResponse;
  if (wrapped.items && Array.isArray(wrapped.items)) return wrapped.items;
  return (
    ((data as { items?: unknown[] })?.items ??
      (data as { data?: unknown[] })?.data ??
      []) as RawNotification[]
  );
}

/** Via le backend endoscopie — filtré par ENDOSCOPIE_SERVICE_ID côté serveur. */
export async function fetchNotificationsViaBackend(
  status = 'ENVOYE',
): Promise<NotificationItem[]> {
  const params = new URLSearchParams({
    status,
    serviceId: ENDOSCOPIE_SERVICE_ID,
  });
  const resp = await fetch(apiUrl(`/api/notifications?${params.toString()}`));
  if (!resp.ok) {
    throw new Error(`Notifications (${resp.status})`);
  }
  const data = await resp.json();
  return parseItems(data).map(normalizeNotification);
}

/** Appel direct au service notification puis filtre local par serviceId. */
export async function fetchNotificationsDirect(
  status = 'ENVOYE',
): Promise<NotificationItem[]> {
  // Passé par le gateway CHU : jeton Bearer obligatoire, contrairement à l'ancien appel
  // direct au service notification. Seul jeton disponible côté navigateur : celui de
  // l'utilisateur connecté (voir currentRoleHeaders) — pas de compte de service ici.
  const resp = await fetch(
    `${NOTIFICATION_API_URL}/notifications?status=${encodeURIComponent(status)}`,
    { headers: currentRoleHeaders() },
  );
  if (!resp.ok) {
    throw new Error(`Notifications direct (${resp.status})`);
  }
  const data = await resp.json();
  const sid = ENDOSCOPIE_SERVICE_ID.toLowerCase();
  return parseItems(data)
    .filter((raw) => JSON.stringify(raw).toLowerCase().includes(sid))
    .map(normalizeNotification);
}

export async function loadNotifications(status = 'ENVOYE'): Promise<NotificationItem[]> {
  try {
    return await fetchNotificationsViaBackend(status);
  } catch {
    return fetchNotificationsDirect(status);
  }
}
