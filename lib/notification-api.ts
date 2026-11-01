import { apiUrl, currentRoleHeaders } from './api';
import { endoscopieServiceId, GATEWAY_URL, sessionEndoscopie } from './config';


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
      endoscopieServiceId(),
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

/** Via le backend endoscopie — filtré par le service Endoscopie côté serveur. */
export async function fetchNotificationsViaBackend(
  status = 'ENVOYE',
): Promise<NotificationItem[]> {
  const params = new URLSearchParams({
    status,
    serviceId: endoscopieServiceId(),
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
  // Seules les notifications de l'utilisateur connecté, de son service Endoscopie et de
  // son rôle : jamais la liste globale de la plateforme (celle de tous les services et
  // de tous les CHU), filtrée ensuite dans le navigateur.
  const session = sessionEndoscopie();
  if (!session) return [];
  const params = new URLSearchParams({ serviceId: session.serviceId, role: session.role });
  const resp = await fetch(
    `${GATEWAY_URL}/notifications/user/${encodeURIComponent(session.userId)}?${params.toString()}`,
    { headers: currentRoleHeaders() },
  );
  if (!resp.ok) {
    throw new Error(`Notifications direct (${resp.status})`);
  }
  const data = await resp.json();
  const lues = status === 'LU';
  return parseItems(data)
    .filter((raw) => Boolean(raw.read) === lues)
    .map(normalizeNotification);
}

/** Accusé de lecture sur le service notification (persistant, tous postes confondus). */
export async function markCentralNotificationRead(id: string): Promise<void> {
  const session = sessionEndoscopie();
  if (!session || !id) return;
  await fetch(`${GATEWAY_URL}/notifications/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...currentRoleHeaders() },
    body: JSON.stringify({ ids: [id], userId: session.userId }),
  }).catch(() => undefined);
}

/**
 * Les deux sources, toujours : la boîte locale du backend est en mémoire (vidée à chaque
 * redémarrage du serveur, fréquent quand il s'endort), le service notification garde
 * l'historique. Lire seulement la première faisait disparaître les nouvelles
 * prescriptions de la cloche alors qu'elles étaient bien dans le fil de travail.
 * Les doublons sont fusionnés par l'appelant (mergeNotifications).
 */
export async function loadNotifications(status = 'ENVOYE'): Promise<NotificationItem[]> {
  const [backend, central] = await Promise.allSettled([
    fetchNotificationsViaBackend(status),
    fetchNotificationsDirect(status),
  ]);
  if (backend.status === 'rejected' && central.status === 'rejected') {
    throw central.reason;
  }
  return [
    ...(backend.status === 'fulfilled' ? backend.value : []),
    ...(central.status === 'fulfilled' ? central.value : []),
  ];
}
