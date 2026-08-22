"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
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
  // Id du service notification externe — le même événement peut nous arriver via la boîte
  // locale (id = UUID généré chez nous) ET via l'appel direct de secours au service externe
  // (id = celui du service externe) : dédupliquer sur ce champ, commun aux deux sources,
  // plutôt que sur `id` évite d'afficher deux fois la même prescription (voir mergeNotifications).
  externalId?: string;
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

const CPA_BLOC_TYPES = new Set(["CPA_RESULTAT", "VPA_REALISEE"]);

// Répartition des notifications par rôle : le major n'est notifié que de l'arrivée de
// nouvelles prescriptions ; le médecin, du passage "prêt pour décision" (RDV planifié
// par le major) et des réponses du Bloc Opératoire (CPA/VPA).
const ROLE_VISIBLE_TYPES: Record<string, Set<string>> = {
  MAJOR: new Set(["DEMANDE_EXAMEN"]),
  MEDECIN: new Set(["RENDEZ_VOUS", "CPA_RESULTAT", "VPA_REALISEE"]),
};

/**
 * Un type explicitement assigné à un rôle (ci-dessus) est masqué pour les autres rôles.
 * Un type non couvert par cette répartition (ex. futur type ajouté sans mettre ce mapping
 * à jour) reste visible par défaut plutôt que d'être silencieusement caché.
 */
function isVisibleForRole(type: string, role: string | null | undefined): boolean {
  const allowed = role ? ROLE_VISIBLE_TYPES[role] : undefined;
  if (!allowed) return true;
  const assignedElsewhere = Object.entries(ROLE_VISIBLE_TYPES).some(
    ([r, types]) => r !== role && types.has(type),
  );
  return assignedElsewhere ? allowed.has(type) : true;
}

// Origine de la notification, affichée pour le médecin afin de distinguer un événement
// interne (le major vient de planifier un RDV dans notre propre app) d'une réponse reçue
// d'un service externe (le Bloc Opératoire, pour la CPA/VPA).
const TYPE_ORIGIN: Record<string, "interne" | "externe"> = {
  RENDEZ_VOUS: "interne",
  CPA_RESULTAT: "externe",
  VPA_REALISEE: "externe",
};

function typeOrigin(type: string): "interne" | "externe" | null {
  return TYPE_ORIGIN[type] ?? null;
}

/**
 * Fond distinct selon la provenance/nature de la notification, pour repérer
 * d'un coup d'œil une nouvelle demande d'examen (autre service) d'un résultat
 * d'examen (autre service) ou d'une réponse CPA du Bloc Opératoire sans les
 * confondre dans le flux.
 */
function getNotificationBgClass(type: string): string {
  if (type === "DEMANDE_EXAMEN") return "bg-blue-50";
  if (type === "RESULTAT_EXAMEN") return "bg-emerald-50";
  if (CPA_BLOC_TYPES.has(type)) return "bg-violet-50";
  return "bg-white";
}

function getNotificationBorderClass(type: string): string {
  if (type === "DEMANDE_EXAMEN") return "border-l-4 border-l-blue-400";
  if (type === "RESULTAT_EXAMEN") return "border-l-4 border-l-emerald-400";
  if (CPA_BLOC_TYPES.has(type)) return "border-l-4 border-l-violet-400";
  return "border-l-4 border-l-transparent";
}

function getNotificationIconClass(type: string): string {
  if (type === "DEMANDE_EXAMEN") return "text-blue-600";
  if (type === "RESULTAT_EXAMEN") return "text-emerald-600";
  if (CPA_BLOC_TYPES.has(type)) return "text-violet-600";
  return "text-primary";
}

function getNotificationIconGlyph(type: string): string {
  if (CPA_BLOC_TYPES.has(type)) return "medical_information";
  return "notifications_active";
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
    // Vient directement du service externe : son propre id EST l'externalId.
    externalId: n.id,
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
    externalId: n.externalId,
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
  // `local` en premier : en cas de doublon (même externalId), on garde la version de la
  // boîte locale — motif toujours correctement rempli — plutôt que celle du secours direct
  // au service externe, dont le mapping peut laisser motif vide (voir normalizeNotification).
  for (const n of [...local, ...remote]) {
    const key = n.externalId ?? n.id;
    if (!byKey.has(key)) byKey.set(key, n);
  }
  return [...byKey.values()].sort(
    (a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt),
  );
}

// Une notification arrivée par le chemin "direct" (loadNotifications, isLocal: false —
// y compris quand il passe par notre backend, voir refresh ci-dessous) n'a aucun suivi
// "lu" persistant côté serveur, contrairement à la boîte locale (fetchNotificationInbox).
// Marquer un tel item comme lu ne survivait donc qu'en mémoire React : la moindre
// navigation (chaque page réinstancie son propre AppShell/NotificationBell) démontait le
// composant et perdait cet état, faisant réapparaître la notification comme non lue et
// le compteur ne redescendait jamais. On mémorise donc aussi côté navigateur.
const READ_STORAGE_KEY = "endoscopie_notif_read_ids";
const MAX_STORED_READ_IDS = 300;

function getStoredReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(READ_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markIdReadInStorage(key: string) {
  if (typeof window === "undefined") return;
  try {
    const ids = getStoredReadIds();
    ids.add(key);
    // Borne la taille pour ne pas grossir indéfiniment — garde les entrées les plus
    // récentes en tronquant les plus anciennes.
    window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...ids].slice(-MAX_STORED_READ_IDS)));
  } catch {
    // Stockage indisponible (navigation privée...) — tant pis, pas bloquant.
  }
}

/** Applique le suivi "lu" mémorisé côté navigateur à une liste fraîchement chargée. */
function applyStoredReadStatus(list: DisplayNotification[]): DisplayNotification[] {
  const stored = getStoredReadIds();
  if (stored.size === 0) return list;
  return list.map((n) =>
    n.readAt || !stored.has(n.externalId ?? n.id)
      ? n
      : { ...n, readAt: new Date().toISOString() },
  );
}

/** Id spécial du toast "rattrapage" affiché après connexion (voir refresh) — n'ouvre
 *  jamais de détail au clic (aucune prescription unique à ouvrir), seulement le panneau. */
const CATCHUP_TOAST_ID = "session-catchup";

// Dédoublonnage des arrivées SSE (voir upsert) — au niveau du module (pas useRef) : chaque
// page réinstancie sa propre NotificationBell en la démontant/remontant (voir AppShell, un
// par page plutôt qu'un layout racine unique), et un useRef y serait réinitialisé à chaque
// navigation. Survit tant que l'onglet reste ouvert.
const moduleSeenIds = new Set<string>();

// Le toast/son "pendant votre absence" (voir refresh) ne doit sonner qu'une seule fois par
// connexion — jamais en re-naviguant entre les pages, mais bien de nouveau si un autre
// utilisateur (ou le même sous un autre rôle — Major/Médecin partagent souvent le même
// poste) se connecte ensuite dans le même onglet, sans le fermer. D'où une clé par identité
// (rôle + médecin, voir hasShownCatchupThisSession) plutôt qu'une clé fixe : une simple clé
// fixe dans sessionStorage restait logiquement "déjà montrée" après une déconnexion/
// reconnexion dans le même onglet, empêchant le résumé de resonner pour le nouvel
// utilisateur alors qu'il avait bien manqué quelque chose.
const CATCHUP_DONE_PREFIX = "endoscopie_notif_catchup_done:";

function hasShownCatchupThisSession(identityKey: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.sessionStorage.getItem(CATCHUP_DONE_PREFIX + identityKey) === "1";
  } catch {
    return true;
  }
}

function markCatchupShown(identityKey: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CATCHUP_DONE_PREFIX + identityKey, "1");
  } catch {
    // Stockage indisponible — tant pis, au pire un résumé pourrait resonner une fois de trop.
  }
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
  const { role, medecinId } = useAuth();
  // Identifie l'utilisateur connecté pour le rattrapage "pendant votre absence" (voir
  // hasShownCatchupThisSession) — medecinId d'abord (distingue deux médecins), rôle en
  // repli (utile pour Major, qui n'a pas de medecinId propre).
  const identityKey = medecinId || role || "anonyme";
  const [open, setOpen] = useState(false);
  // Une notification lue disparaissait définitivement du panneau, sans aucun moyen de
  // la retrouver — cet onglet garde un historique consultable des notifications déjà lues.
  const [showRead, setShowRead] = useState(false);
  const [items, setItems] = useState<DisplayNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<DisplayNotification | null>(null);
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
      if (!isVisibleForRole(item.type, role)) return;
      const key = item.externalId ?? item.id;
      if (moduleSeenIds.has(key)) return;
      moduleSeenIds.add(key);
      setItems((prev) => mergeNotifications([item], prev).slice(0, 50));
      showToast(item);
      playNotificationSound();
    },
    [showToast, role],
  );

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [remote, inbox] = await Promise.all([
        loadNotifications("ENVOYE"),
        fetchNotificationInbox(),
      ]);
      const merged = applyStoredReadStatus(
        mergeNotifications(
          remote.map(fromRemote),
          inbox.map(fromInbox),
        ).filter((n) => isVisibleForRole(n.type, role)),
      );

      merged.forEach((n) => moduleSeenIds.add(n.externalId ?? n.id));
      setItems(merged.slice(0, 50));

      // Le son/toast "pendant votre absence" ne se déclenche qu'une seule fois par vraie
      // session (voir hasShownCatchupThisSession) — jamais à un sondage périodique
      // ordinaire, sinon toute notification encore non lue resonnerait toutes les 30
      // secondes tant qu'elle n'est pas ouverte. Les arrivées en direct pendant que
      // l'utilisateur est connecté sont déjà couvertes par upsert (flux temps réel).
      if (!hasShownCatchupThisSession(identityKey)) {
        markCatchupShown(identityKey);
        const unread = merged.filter((n) => !n.readAt);
        if (unread.length === 1) {
          showToast(unread[0]);
          playNotificationSound();
        } else if (unread.length > 1) {
          showToast({
            id: CATCHUP_TOAST_ID,
            type: "",
            motif: `${unread.length} nouvelles notifications reçues pendant votre absence.`,
            receivedAt: new Date().toISOString(),
            isLocal: false,
          });
          playNotificationSound();
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    }
  }, [role, identityKey]);

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

  // Une fois lue (cliquée), une notification disparaît du panneau — seules les non-lues
  // y restent affichées ; le badge de comptage suit donc la même liste.
  const unreadItems = items.filter((n) => !n.readAt);
  const readItems = items.filter((n) => !!n.readAt);
  const unreadCount = unreadItems.length;
  const visibleItems = showRead ? readItems : unreadItems;

  const handleOpenItem = async (item: DisplayNotification) => {
    if (!item.readAt) {
      if (item.isLocal) {
        await markInboxNotificationRead(item.id).catch(() => undefined);
      }
      // Mémorisé côté navigateur dans tous les cas (pas seulement isLocal) — sans ça,
      // une notification arrivée par le chemin direct redevient non lue à la moindre
      // navigation, le compteur ne redescend jamais (voir applyStoredReadStatus).
      markIdReadInStorage(item.externalId ?? item.id);
      setItems((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );
    }
    setOpen(false);

    // La notification référence une prescription (ex. nouvelle demande, RDV planifié) :
    // on ouvre
    // directement son détail. Le bouton "Retour" du dossier patient ramène toujours
    // vers le fil de prescription, peu importe la page depuis laquelle la cloche a
    // été ouverte.
    if (item.entiteRefType?.toLowerCase() === "prescription" && item.entiteRefId) {
      router.push(`/patient-dossier/${encodeURIComponent(item.entiteRefId)}`);
      return;
    }

    // Réponse CPA/VPA du Bloc Opératoire : entiteRefId référence notre dossier CPA
    // local (voir sourceReferenceType: 'dossier-cpa' dans notifyBlocCpa côté backend).
    if (item.entiteRefType?.toLowerCase() === "dossier-cpa" && item.entiteRefId) {
      router.push(`/dossier-cpa/${encodeURIComponent(item.entiteRefId)}`);
      return;
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
          onClick={() => {
            if (toastTimer.current) clearTimeout(toastTimer.current);
            setToast(null);
            // Le résumé "pendant votre absence" regroupe plusieurs notifications — rien
            // d'unique à ouvrir, on ouvre simplement le panneau complet.
            if (toast.id === CATCHUP_TOAST_ID) {
              setOpen(true);
            } else {
              handleOpenItem(toast);
            }
          }}
          className={`fixed top-20 right-4 sm:right-6 z-[60] w-[calc(100vw-2rem)] max-w-80 rounded-xl border border-primary/30 shadow-2xl p-4 cursor-pointer hover:brightness-95 transition-[filter] animate-in fade-in slide-in-from-top-2 ${getNotificationBgClass(toast.type)} ${getNotificationBorderClass(toast.type)}`}
        >
          <div className="flex items-start gap-3">
            <span className={`material-symbols-outlined text-xl ${getNotificationIconClass(toast.type)}`}>
              {getNotificationIconGlyph(toast.type)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-primary uppercase tracking-wide">
                {toast.id === CATCHUP_TOAST_ID ? "Pendant votre absence" : "Nouvelle notification"}
              </p>
              {toast.id !== CATCHUP_TOAST_ID && (
                <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">
                  {typeLabel(toast.type)}
                </p>
              )}
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{splitMotifProcedures(toast.motif).text}</p>
              <ProcedureBadges procedures={splitMotifProcedures(toast.motif).procedures} />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (toastTimer.current) clearTimeout(toastTimer.current);
                setToast(null);
              }}
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
          <div ref={panelRef} className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-80 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl z-50">
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
            <div className="px-4 pt-2 flex items-center gap-2 border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setShowRead(false)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                  !showRead ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                Non lues{unreadCount > 0 ? ` (${unreadCount})` : ""}
              </button>
              <button
                type="button"
                onClick={() => setShowRead(true)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                  showRead ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                Déjà lues
              </button>
            </div>
            {error && <p className="px-4 py-3 text-xs text-red-600">{error}</p>}
            {!error && visibleItems.length === 0 && (
              <p className="px-4 py-3 text-xs text-slate-500">
                {showRead ? "Aucune notification déjà lue." : "Aucune notification."}
              </p>
            )}
            {!error &&
              visibleItems.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleOpenItem(n)}
                  className={`w-full px-4 py-3 border-b border-slate-50 hover:brightness-95 text-left transition-[filter] ${getNotificationBgClass(n.type)} ${getNotificationBorderClass(n.type)}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      {!n.readAt && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden />}
                      {CPA_BLOC_TYPES.has(n.type) && (
                        <span className={`material-symbols-outlined text-sm ${getNotificationIconClass(n.type)}`}>
                          {getNotificationIconGlyph(n.type)}
                        </span>
                      )}
                      {typeLabel(n.type)}
                      {typeOrigin(n.type) && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                            typeOrigin(n.type) === "externe"
                              ? "bg-violet-100 text-violet-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {typeOrigin(n.type)}
                        </span>
                      )}
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
