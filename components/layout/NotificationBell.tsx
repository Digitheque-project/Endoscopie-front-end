"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { getExamTypeBadgeClass } from "@/lib/exam-type-colors";

const TYPE_LABELS: Record<string, string> = {
  DEMANDE_EXAMEN: "Demande examen",
  ORDONNANCE: "Ordonnance",
  CPA_DEMANDE: "Demande CPA",
  RENDEZ_VOUS: "Rendez-vous",
  AVIS_INTER_SERVICE: "Avis inter-service",
  RESULTAT_EXAMEN: "Résultat examen",
  CPA_RESULTAT: "Réponse CPA du Bloc",
  VPA_REALISEE: "Visite pré-anesthésique réalisée",
};

type DisplayNotification = {
  id: string;
  type: string;
  motif: string;
  emitterName?: string;
  receivedAt: string;
  readAt?: string | null;
  isLocal: boolean;
  entiteRefType?: string;
  entiteRefId?: string;
};

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type.replace(/_/g, " ");
}

/**
 * Fond distinct selon la provenance/nature de la notification, pour repérer
 * d'un coup d'œil une nouvelle demande d'examen (autre service) d'un résultat
 * d'examen (autre service) sans les confondre dans le flux.
 */
function getNotificationBgClass(type: string): string {
  if (type === "DEMANDE_EXAMEN") return "bg-blue-50";
  if (type === "RESULTAT_EXAMEN") return "bg-emerald-50";
  return "bg-white";
}

function getNotificationBorderClass(type: string): string {
  if (type === "DEMANDE_EXAMEN") return "border-l-4 border-l-blue-400";
  if (type === "RESULTAT_EXAMEN") return "border-l-4 border-l-emerald-400";
  return "border-l-4 border-l-transparent";
}

function getNotificationIconClass(type: string): string {
  if (type === "DEMANDE_EXAMEN") return "text-blue-600";
  if (type === "RESULTAT_EXAMEN") return "text-emerald-600";
  return "text-primary";
}

/**
 * Le motif embarque parfois la ou les procédures après un tiret cadratin
 * (ex. "Nouvelle prescription endoscopie — Coloscopie + Fibroscopie") — on les
 * extrait pour les afficher en badges plutôt qu'en texte brut, purement pour
 * la présentation (le texte du motif lui-même n'est pas modifié côté backend).
 */
function splitMotifProcedures(motif: string): { text: string; procedures: string[] } {
  const sepIndex = motif.indexOf(" — ");
  if (sepIndex === -1) return { text: motif, procedures: [] };
  const text = motif.slice(0, sepIndex);
  const procedures = motif
    .slice(sepIndex + 3)
    .split(" + ")
    .map((p) => p.trim())
    .filter(Boolean);
  return { text, procedures };
}

function ProcedureBadges({ procedures }: { procedures: string[] }) {
  if (procedures.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {procedures.map((proc, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1 max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-bold ${getExamTypeBadgeClass(proc)}`}
        >
          <span className="material-symbols-outlined text-[12px] shrink-0">medical_services</span>
          <span className="truncate">{proc}</span>
        </span>
      ))}
    </div>
  );
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
    entiteRefType: n.entiteRefType,
    entiteRefId: n.entiteRefId,
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
    entiteRefType: n.entiteRefType,
    entiteRefId: n.entiteRefId,
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
  const router = useRouter();
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

    // La notification référence une prescription (ex. nouvelle demande) : on ouvre
    // directement son détail. Le bouton "Retour" du dossier patient ramène toujours
    // vers le fil de prescription, peu importe la page depuis laquelle la cloche a
    // été ouverte.
    if (item.entiteRefType?.toLowerCase() === "prescription" && item.entiteRefId) {
      router.push(`/patient-dossier/${encodeURIComponent(item.entiteRefId)}`);
    }
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
          className={`fixed top-20 right-6 z-[60] w-80 rounded-xl border border-primary/30 shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 ${getNotificationBgClass(toast.type)} ${getNotificationBorderClass(toast.type)}`}
        >
          <div className="flex items-start gap-3">
            <span className={`material-symbols-outlined text-xl ${getNotificationIconClass(toast.type)}`}>
              notifications_active
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-primary uppercase tracking-wide">
                Nouvelle notification
              </p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">
                {typeLabel(toast.type)}
              </p>
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{splitMotifProcedures(toast.motif).text}</p>
              <ProcedureBadges procedures={splitMotifProcedures(toast.motif).procedures} />
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
                  className={`w-full px-4 py-3 border-b border-slate-50 hover:brightness-95 text-left transition-[filter] ${getNotificationBgClass(n.type)} ${getNotificationBorderClass(n.type)}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      {!n.readAt && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden />}
                      {typeLabel(n.type)}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatTime(n.receivedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">{splitMotifProcedures(n.motif).text}</p>
                  <ProcedureBadges procedures={splitMotifProcedures(n.motif).procedures} />
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
