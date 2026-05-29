import { apiUrl } from './api';

const NOTIFICATION_API_URL =
  process.env.NEXT_PUBLIC_NOTIFICATION_API_URL?.trim().replace(/\/$/, '') ||
  'https://service-notification.onrender.com';

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
};

/** Réponse brute du service notification (snake_case). */
type RawNotification = Record<string, unknown>;

function normalizeNotification(raw: RawNotification): NotificationItem {
  return {
    id: (raw.id as string) ?? undefined,
    type: (raw.type as string) ?? undefined,
    motif: (raw.motif as string) ?? undefined,
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
  };
}

function parseNotificationList(data: unknown): NotificationItem[] {
  const list = Array.isArray(data)
    ? data
    : (data as { items?: unknown[] })?.items ??
      (data as { data?: unknown[] })?.data ??
      [];
  return (list as RawNotification[]).map(normalizeNotification);
}

const ENDOSCOPIE_TYPES = new Set([
  'DEMANDE_EXAMEN',
  'ORDONNANCE',
  'CPA_DEMANDE',
  'RENDEZ_VOUS',
]);

/** Filtre les notifications récentes liées à l’unité endoscopie. */
export function filterRecentEndoscopieNotifications(
  items: NotificationItem[],
  max = 20,
): NotificationItem[] {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return items
    .filter((n) => {
      if (n.createdAt) {
        const t = Date.parse(n.createdAt);
        if (!Number.isNaN(t) && t < cutoff) return false;
      }
      const motif = (n.motif ?? '').toLowerCase();
      if (n.type && ENDOSCOPIE_TYPES.has(n.type)) return true;
      if (motif.includes('endoscop')) return true;
      if ((n.emitterName ?? '').toLowerCase().includes('endoscop')) return true;
      return false;
    })
    .sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return tb - ta;
    })
    .slice(0, max);
}

/** Via le backend endoscopie (recommandé — évite CORS). */
export async function fetchNotificationsViaBackend(
  status = 'ENVOYE',
): Promise<NotificationItem[]> {
  const resp = await fetch(apiUrl(`/api/notifications?status=${encodeURIComponent(status)}`));
  if (!resp.ok) {
    throw new Error(`Notifications (${resp.status})`);
  }
  const data = await resp.json();
  return parseNotificationList(data);
}

/** Appel direct au service notification (si CORS autorisé). */
export async function fetchNotificationsDirect(
  status = 'ENVOYE',
): Promise<NotificationItem[]> {
  const resp = await fetch(
    `${NOTIFICATION_API_URL}/notifications?status=${encodeURIComponent(status)}`,
  );
  if (!resp.ok) {
    throw new Error(`Notifications direct (${resp.status})`);
  }
  const data = await resp.json();
  return parseNotificationList(data);
}

export async function loadNotifications(status = 'ENVOYE'): Promise<NotificationItem[]> {
  let items: NotificationItem[];
  try {
    items = await fetchNotificationsViaBackend(status);
  } catch {
    items = await fetchNotificationsDirect(status);
  }
  return filterRecentEndoscopieNotifications(items);
}
