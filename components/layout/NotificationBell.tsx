"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadNotifications,
  type NotificationItem,
} from "@/lib/notification-api";
import {
  fetchNotificationInbox,
  markInboxNotificationRead,
  subscribeNotificationStream,
  type InboxNotification,
} from "@/lib/notification-inbox";

const TYPE_LABELS: Record<string, string> = {
  DEMANDE_EXAMEN: "Demande examen",
  ORDONNANCE: "Ordonnance",
  CPA_DEMANDE: "Demande CPA",
  RENDEZ_VOUS: "Rendez-vous",
  AVIS_INTER_SERVICE: "Avis inter-service",
  RESULTAT_EXAMEN: "Résultat examen",
};

type DisplayNotification = {
  id: string;
  type: string;
  motif: string;
  emitterName?: string;
  receivedAt: string;
  readAt?: string | null;
  isLocal: boolean;
};

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type.replace(/_/g, " ");
}

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-BE", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function fromRemote(n: NotificationItem): DisplayNotification {
  return {
    id: n.id ?? `remote-${n.createdAt ?? Date.now()}`,
    type: n.type ?? "Alerte",
    motif: n.motif ?? "—",
    emitterName: n.emitterName,
    receivedAt: n.createdAt ?? new Date().toISOString(),
    readAt: n.readAt,
    isLocal: false,
  };
}

function fromInbox(n: InboxNotification): DisplayNotification {
  return {
    id: n.id,
    type: n.type,
    motif: n.motif,
    emitterName: n.emitterName,
    receivedAt: n.receivedAt,
    readAt: n.readAt,
    isLocal: true,
  };
}

function mergeNotifications(
  remote: DisplayNotification[],
  local: DisplayNotification[],
): DisplayNotification[] {
  const byKey = new Map<string, DisplayNotification>();
  for (const n of [...local, ...remote]) {
    const key = n.id;
    if (!byKey.has(key)) byKey.set(key, n);
  }
  return [...byKey.values()].sort(
    (a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt),
  );
}

function playNotificationSound() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.3);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.1);
    gain2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<DisplayNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<DisplayNotification | null>(null);
  const seenIds = useRef(new Set<string>());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const showToast = useCallback((item: DisplayNotification) => {
    setToast(item);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const upsert = useCallback(
    (item: DisplayNotification) => {
      if (seenIds.current.has(item.id)) return;
      seenIds.current.add(item.id);
      setItems((prev) => mergeNotifications([item], prev).slice(0, 50));
      showToast(item);
      playNotificationSound();
    },
    [showToast],
  );

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [remote, inbox] = await Promise.all([
        loadNotifications("ENVOYE"),
        fetchNotificationInbox(),
      ]);
      const merged = mergeNotifications(
        remote.map(fromRemote),
        inbox.map(fromInbox),
      );
      merged.forEach((n) => seenIds.current.add(n.id));
      setItems(merged.slice(0, 50));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    }
  }, []);

  useEffect(() => {
    refresh();
    const poll = setInterval(refresh, 30000);
    const unsubscribe = subscribeNotificationStream((item) => {
      upsert(fromInbox(item));
    });
    return () => {
      clearInterval(poll);
      unsubscribe();
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [refresh, upsert]);

  const unreadCount = items.filter((n) => !n.readAt).length;

  const handleOpenItem = async (item: DisplayNotification) => {
    if (!item.readAt) {
      if (item.isLocal) {
        await markInboxNotificationRead(item.id).catch(() => undefined);
      }
      setItems((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  return (
    <>
      {toast && (
        <div
          role="alert"
          className="fixed top-20 right-6 z-[60] w-80 rounded-xl border border-primary/30 bg-white shadow-2xl p-4 animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-xl">
              notifications_active
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-primary uppercase tracking-wide">
                Nouvelle notification
              </p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">
                {typeLabel(toast.type)}
              </p>
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{toast.motif}</p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Fermer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            if (!open) refresh();
          }}
          className="p-2 text-slate-500 hover:bg-slate-200/50 transition-colors rounded-full relative"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-100 text-red-600 border border-red-200 text-[10px] font-bold rounded-full">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div ref={panelRef} className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl z-50">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800">Notifications Endoscopie</p>
              <button
                type="button"
                onClick={refresh}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Actualiser
              </button>
            </div>
            {error && <p className="px-4 py-3 text-xs text-red-600">{error}</p>}
            {!error && items.length === 0 && (
              <p className="px-4 py-3 text-xs text-slate-500">Aucune notification.</p>
            )}
            {!error &&
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleOpenItem(n)}
                  className={`w-full px-4 py-3 border-b border-slate-50 hover:bg-slate-50 text-left ${
                    !n.readAt ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-700">
                      {typeLabel(n.type)}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatTime(n.receivedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">{n.motif}</p>
                  {n.emitterName && (
                    <p className="text-[10px] text-slate-400 mt-1">{n.emitterName}</p>
                  )}
                </button>
              ))}
          </div>
        )}
      </div>
    </>
  );
}
