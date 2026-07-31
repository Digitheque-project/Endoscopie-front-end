import { apiFetch, apiUrl } from './api';

export type InboxNotification = {
  id: string;
  externalId?: string;
  type: string;
  motif: string;
  urgence?: number;
  status?: string;
  patientId?: string;
  emitterName?: string;
  recipientName?: string;
  entiteRefType?: string;
  entiteRefId?: string;
  payload?: Record<string, unknown>;
  receivedAt: string;
  readAt?: string | null;
};

type InboxResponse = {
  items: InboxNotification[];
  webhookUrl?: string;
};

/** readAt renvoyé par le backend est propre au rôle courant (x-user-role, voir apiFetch) —
 * le major et le médecin ont chacun leur propre statut lu/non-lu pour la même notification. */
export async function fetchNotificationInbox(): Promise<InboxNotification[]> {
  const resp = await apiFetch('/api/notifications/inbox');
  if (!resp.ok) {
    throw new Error(`Inbox (${resp.status})`);
  }
  const data = (await resp.json()) as InboxResponse;
  return data.items ?? [];
}

export async function markInboxNotificationRead(id: string): Promise<void> {
  await apiFetch(`/api/notifications/inbox/${encodeURIComponent(id)}/read`, {
    method: 'POST',
  });
}

/** Connexion SSE — notifications poussées par le backend en temps réel. */
export function subscribeNotificationStream(
  onNotification: (item: InboxNotification) => void,
  onError?: (err: Event) => void,
): () => void {
  const url = apiUrl('/api/notifications/stream');
  const es = new EventSource(url);

  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as InboxNotification & { type?: string };
      if (data.type === 'ping') return;
      if (!data.motif || !data.id) return;
      onNotification(data as InboxNotification);
    } catch {
      /* ignore malformed */
    }
  };

  es.onerror = (ev) => {
    onError?.(ev);
  };

  return () => es.close();
}
