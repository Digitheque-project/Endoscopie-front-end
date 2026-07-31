"use client";

import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { apiJson, updateRendezVous, verifierStatutCpa } from "@/lib/api";
import toast from "react-hot-toast";
import SelectFilter from "@/components/ui/SelectFilter";
import ComboboxFilter from "@/components/ui/ComboboxFilter";
import TreatButton from "@/components/navigation/TreatButton";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, useRef, type KeyboardEvent } from "react";
import { usePatient } from "@/contexts/PatientContext";
import { useAuth } from "@/contexts/AuthContext";
import { getExamTypeBadgeClass } from "@/lib/exam-type-colors";
import { PriseEnChargeBadge, priseEnChargeStripeClass } from "@/components/patient/PriseEnChargeBadge";

const STATUS_LABELS: Record<string, string> = {
  "Planifié": "En attente de décision médecin",
  "Confirmé": "Confirmé — RDV planifié",
  "CPA demandée": "En attente CPA",
  "CPA Défavorable": "CPA défavorable — parcours bloqué",
  "CPA Reportée": "CPA reportée — à redemander",
};

const EXCLUDED_RDV_STATUTS = new Set(["Annulé", "Terminé"]);
const MAJOR_TRACKED_STATUTS = new Set([
  "A planifier",
  "Planifié",
  "Décision rendue",
  "Confirmé",
  "CPA demandée",
  "CPA Défavorable",
  "CPA Reportée",
]);

type MedecinTab = "a-decider" | "pret" | "tous";
const MEDECIN_TABS: { key: MedecinTab; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "a-decider", label: "À décider" },
  { key: "pret", label: "Prêt pour l'examen" },
];

// La CPA (consultation pré-anesthésique) doit être favorable avant de pouvoir
// considérer le patient prêt pour l'examen — sécurité patient.
const BLOCKING_CPA_DECISIONS = new Set(["INAPTE", "REPORT"]);

function medecinRowState(req: any): MedecinTab | "autre" | "cpa-bloquee" {
  if (!req.rendezVous) return "autre";
  if (!req.rendezVous.typeAnesthesie) return "a-decider";
  if (EXCLUDED_RDV_STATUTS.has(req.rendezVous.statut)) return "autre";
  if (req.checklistApresValide) return "autre";
  if (BLOCKING_CPA_DECISIONS.has(req.dossierCPA?.decisionCpa)) return "cpa-bloquee";
  return "pret";
}

function PrescriptionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPatientData } = usePatient();
  const { role } = useAuth();
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const filterPanelRef = useRef<HTMLDivElement | null>(null);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [examTypes, setExamTypes] = useState<{ id: string; name: string }[]>([]);
  const [doctorNames, setDoctorNames] = useState<string[]>([]);
  const [salles, setSalles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const initialTab = (searchParams.get("tab") as MedecinTab) || "tous";
  const [medecinTab, setMedecinTab] = useState<MedecinTab>(
    MEDECIN_TABS.some((t) => t.key === initialTab) ? initialTab : "tous",
  );
  const [filters, setFilters] = useState({
    nom: "",
    procedure: "",
    medecin: "",
    date: ""
  });
  const [showFilters, setShowFilters] = useState(false);

  const getPriorityScore = (p: any) => {
    const now = new Date();
    const demandeDate = p.dateDemande ? new Date(p.dateDemande) : new Date();
    const daysOld = Math.max(0, Math.floor((now.getTime() - demandeDate.getTime()) / 86400000));
    const prioriteUpper = (p.priorite || "").toString().toUpperCase();
    const patientStatus = (p.patient?.statut || p.patient?.status || "").toString().toUpperCase();
    const isHospitalized = p.patient?.hospitalise === true || p.patient?.hospitalise === "oui" || p.patient?.hospitalise === "OUI" || p.patient?.hospitalise === "true";
    const hasVitalSign = [p.urgenceVitale, p.urgence, p.patient?.urgence].some(
      (value) => typeof value === "string" && value.toString().toLowerCase().includes("vital")
    );
    const isToday = demandeDate.toDateString() === now.toDateString();

    let score = 0;
    if (prioriteUpper === "STAT" || prioriteUpper === "URGENCE VITALE") score += 35;
    else if (prioriteUpper === "URGENT" || prioriteUpper === "URGENCE") score += 20;
    else score += 10;

    if (hasVitalSign) score += 35;
    if (isHospitalized) score += 25;
    if (isToday) score += 20;
    score += Math.min(30, daysOld * 2);

    if (patientStatus.includes("URGENT") || patientStatus.includes("URGENCE")) score += 20;
    else if (patientStatus.includes("CONTROLE")) score += 5;
    else if (patientStatus.includes("NORMAL")) score += 10;

    return score;
  };

  const getPriorityLevel = (score: number) => {
    if (score >= 60) return "Élevée";
    if (score >= 35) return "Moyenne";
    return "Faible";
  };

  const getPriorityIndicator = (rawPriority: string) => {
    const p = rawPriority.toUpperCase();
    if (p === "STAT" || p === "URGENCE VITALE") {
      return {
        label: p === "STAT" ? "TRES URGENT" : "Urgent Vital",
        icon: "warning",
        className: "bg-red-600 text-white animate-pulse font-bold",
      };
    }
    if (p === "URGENT" || p === "URGENCE") {
      return { label: "Urgent", icon: "priority_high", className: "bg-[#EA580C] hover:bg-[#C2410C] active:scale-95 transition-all text-white font-bold shadow-sm" };
    }
    return { label: "Normale", icon: "check_circle", className: "bg-success-container text-success font-bold" };
  };

  const fetchPrescriptions = async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setIsLoading(true);
      setError(null);

      // Seule /api/prescriptions est indispensable à l'affichage du fil : un raté sur
      // /api/medecins ou /api/exam-types (listes annexes utilisées pour les filtres/noms
      // affichés) ne doit jamais faire échouer toute la page avec l'écran d'erreur.
      const [data, docsData, examTypesData] = await Promise.all([
        apiJson<any[]>('/api/prescriptions'),
        apiJson<any[]>('/api/medecins').catch(() => []),
        apiJson<{ id: string; name: string }[]>('/api/exam-types').catch(() => []),
      ]);
      setDoctorNames(
        (Array.isArray(docsData) ? docsData : []).map((d: any) => `Dr. ${d.prenom} ${d.nom}`.trim()),
      );
      setExamTypes(Array.isArray(examTypesData) ? examTypesData : []);

      const mapped = (Array.isArray(data) ? data : []).map((p: any) => {
        const prioriteUpper = p.priorite?.toString().toUpperCase() || "STANDARD";
        const prescriberName = `Dr. ${p.medecinPrescripteur?.prenom || ""} ${p.medecinPrescripteur?.nom || ""}`.trim();
        const urgencyScore = getPriorityScore(p);
        const priorityLevel = getPriorityLevel(urgencyScore);
        const indicator = getPriorityIndicator(prioriteUpper);

        // Rang d'urgence strict pour le tri du fil — TRES URGENT doit toujours passer
        // avant URGENT, qui doit toujours passer avant NORMAL, quelle que soit la date
        // de la demande (voir priorityRequests ci-dessous, urgencyScore n'est utilisé
        // que pour le badge "Élevée/Moyenne/Faible", pas pour l'ordre d'affichage).
        const priorityRank =
          prioriteUpper === "STAT" || prioriteUpper === "URGENCE VITALE"
            ? 0
            : prioriteUpper === "URGENT" || prioriteUpper === "URGENCE"
              ? 1
              : 2;

        return {
          id: p.id,
          // Regroupe les demandes issues d'une même prescription externe multi-examens
          // (ex: Coloscopie + Fibroscopie pour le même patient) — voir groupedRequests.
          prescriptionExternalId: p.prescriptionExternalId ?? null,
          priorityRank,
          dateDemandeRaw: p.dateDemande || null,
          medecinId: p.medecinId,
          patientId: p.patient?.id || p.patientId,
          // Preserve original name (case preserved) for navigation/synchronization,
          // while `name` remains the displayed uppercase variant for consistency.
          originalName: `${p.patient?.nom || ""} ${p.patient?.prenom || ""}`.trim() || "Patient Inconnu",
          name: `${p.patient?.nom || ""} ${p.patient?.prenom || ""}`.trim().toUpperCase() || "PATIENT INCONNU",
          priority: prioriteUpper,
          procedure: p.typeExamen || "Examen Endoscopique",
          prescriber: prescriberName || "Médecin Inconnu",
          prescriberSpecialite: p.medecinPrescripteur?.specialite || "",
          reason: p.motif || "Non spécifié",
          receivedTime: p.dateDemande ? new Date(p.dateDemande).toLocaleDateString("fr-FR") : "Date inconnue",
          urgencyScore,
          priorityLevel,
          priorityIndicator: indicator.label,
          priorityIndicatorIcon: indicator.icon,
          priorityIndicatorClass: indicator.className,
          status: p.statut || p.status || p.etat || "A planifier",
          rendezVous: p.rendezVous || null,
          checklistApresValide: !!p.checklistApres?.estValide,
          dossierCPA: p.dossierCPA || null,
          priseEnChargeId: p.patient?.priseEnChargeId || null,
        };
      });

      setAllRequests(mapped);
    } catch (error: any) {
      console.error("Erreur de récupération des prescriptions:", error);
      // En rafraîchissement silencieux, on garde la liste déjà affichée plutôt que
      // de la remplacer par un écran d'erreur pour un simple raté réseau ponctuel.
      if (!opts?.silent) {
        setError("Impossible de contacter le serveur. Veuillez vérifier que le backend est lancé.");
      }
    } finally {
      if (!opts?.silent) setIsLoading(false);
    }
  };

  const fetchSalles = async () => {
    try {
      const data = await apiJson<any[]>('/api/salles');
      setSalles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Erreur de récupération des salles:", e);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    fetchSalles();
  }, []);

  // Rafraîchit automatiquement la liste (et les salles) pour que les nouvelles
  // prescriptions et les salles ajoutées/modifiées apparaissent sans que
  // l'utilisateur ait besoin de recharger la page.
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) return;
      fetchPrescriptions({ silent: true });
      fetchSalles();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showFilters) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        filterPanelRef.current &&
        !filterPanelRef.current.contains(target) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(target)
      ) {
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showFilters]);

  const handleFilterKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setShowFilters(false);
    }
  };

  const closeFilterPanel = () => setShowFilters(false);

  const handleDetail = (id: string) => {
    // Conserve l'onglet médecin actif ("À décider", "Prêt pour l'examen"...) pour que le
    // retour depuis le détail y ramène, plutôt que de retomber sur "Tous".
    const params = role === "MEDECIN" ? `?tab=${encodeURIComponent(medecinTab)}` : "";
    router.push(`/patient-dossier/${encodeURIComponent(id)}${params}`);
  };

  const handlePlanifier = (req: any, group?: any[]) => {
    const params = new URLSearchParams();
    if (req.id) params.set("prescriptionId", String(req.id));
    if (req.medecinId) params.set("medecinId", String(req.medecinId));
    if (req.patientId) params.set("patientId", String(req.patientId));
    // Prefer the original (case-preserved) name when navigating to planning
    if (req.originalName) params.set("patientName", String(req.originalName));
    else if (req.name) params.set("patientName", String(req.name));
    if (req.procedure) params.set("procedure", String(req.procedure));
    if (req.prescriber) params.set("prescriber", String(req.prescriber));
    if (req.reason) params.set("reason", String(req.reason));
    if (req.priority) params.set("priority", String(req.priority));
    params.set("from", "prescriptions");
    // Prescription multi-examens (ex. Coloscopie + Fibroscopie) : transmet la liste
    // complète pour que la planification puisse enchaîner chaque examen l'un après l'autre.
    if (group && group.length > 1) {
      params.set(
        "groupExams",
        JSON.stringify(group.map((g) => ({ id: g.id, procedure: g.procedure, status: g.status }))),
      );
    }

    // Persist selection in PatientContext to ensure downstream pages can fallback reliably
    try {
      setPatientData({
        patientId: req.patientId || "",
        prescriptionId: req.id || "",
        patientName: req.originalName || req.name || "",
        procedure: req.procedure || "",
        prescriber: req.prescriber || "",
        priority: req.priority || "NORMAL",
      });
    } catch (e) {
      // ignore if context not available
    }

    router.push(`/planification-examens?${params.toString()}`);
  };

  const handleEnvoyerConfirmation = async (req: any) => {
    if (!req.rendezVous?.id) return;
    setConfirmingId(req.id);
    setConfirmError(null);
    try {
      await updateRendezVous(req.rendezVous.id, { statut: "Confirmé" });
      await fetchPrescriptions();
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : "Erreur lors de l'envoi de la confirmation.");
    } finally {
      setConfirmingId(null);
    }
  };

  // Filet de sécurité : si le webhook de retour du Bloc Opératoire (CPA_RESULTAT)
  // n'est jamais arrivé, le major peut forcer une vérification manuelle du statut.
  // Le retour se fait en toast (bas d'écran) plutôt qu'en bandeau en haut de page,
  // pour rester visible sans avoir à remonter en scroll dans une liste potentiellement
  // longue.
  const [verifyingCpaId, setVerifyingCpaId] = useState<string | null>(null);

  const handleVerifierStatutCpa = async (req: any) => {
    const dossierId = req.dossierCPA?.id;
    if (!dossierId) return;
    setVerifyingCpaId(req.id);
    try {
      const result = await verifierStatutCpa(dossierId);
      if (result.blocSync === "en_attente") {
        toast("Le Bloc Opératoire n'a pas encore rendu de décision pour cette CPA.", { icon: "⏳" });
      } else if (result.blocSync === "erreur_bloc" || result.blocSync === "erreur_reseau") {
        toast.error("Impossible de contacter le Bloc Opératoire pour le moment. Réessayez plus tard.");
      } else if (result.blocSync === "synchronise") {
        toast.success("Statut CPA mis à jour.");
      }
      await fetchPrescriptions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la vérification du statut CPA.");
    } finally {
      setVerifyingCpaId(null);
    }
  };

  // Petite interface "Maintenir la date prévue / Décaler la date" ouverte en cliquant
  // sur le statut "Décision rendue" — permet au major de confirmer ou de replanifier
  // le rendez-vous déjà fixé avant de poursuivre le parcours (CPA, confirmation...).
  const [decisionReq, setDecisionReq] = useState<any | null>(null);
  const [decisionMode, setDecisionMode] = useState<"choix" | "decaler">("choix");
  const [decisionDate, setDecisionDate] = useState("");
  const [decisionHeure, setDecisionHeure] = useState("");
  const [isDecisionSaving, setIsDecisionSaving] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const openDecisionModal = (req: any) => {
    setDecisionReq(req);
    setDecisionMode("choix");
    setDecisionError(null);
    if (req.rendezVous?.dateHeureDebut) {
      const d = new Date(req.rendezVous.dateHeureDebut);
      const pad = (n: number) => n.toString().padStart(2, "0");
      setDecisionDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
      setDecisionHeure(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
    }
  };

  const closeDecisionModal = () => {
    setDecisionReq(null);
    setDecisionMode("choix");
    setDecisionError(null);
  };

  const handleConfirmDecalage = async () => {
    if (!decisionReq?.rendezVous?.id || !decisionDate || !decisionHeure) return;
    setIsDecisionSaving(true);
    setDecisionError(null);
    try {
      await updateRendezVous(decisionReq.rendezVous.id, {
        dateHeureDebut: `${decisionDate}T${decisionHeure}:00`,
      });
      await fetchPrescriptions();
      closeDecisionModal();
    } catch (err) {
      setDecisionError(err instanceof Error ? err.message : "Erreur lors du décalage du rendez-vous.");
    } finally {
      setIsDecisionSaving(false);
    }
  };

  const handleDemandeCpaFromFil = (req: any) => {
    const params = new URLSearchParams();
    if (req.patientId) params.set("patientId", String(req.patientId));
    if (req.id) params.set("prescriptionId", String(req.id));
    if (req.originalName) params.set("patientName", String(req.originalName));
    else if (req.name) params.set("patientName", String(req.name));
    if (req.procedure) params.set("procedure", String(req.procedure));
    if (req.prescriber) params.set("prescriber", String(req.prescriber));
    if (req.priority) params.set("priority", String(req.priority));
    router.push(`/demande-cpa?${params.toString()}`);
  };

  // Boutons d'action pour UN examen — appelé une fois par examen d'une ligne
  // groupée (prescription multi-examens) pour que chacun garde sa propre action
  // indépendamment de l'état des autres examens du même groupe.
  const renderActions = (req: any, group?: any[]) => (
    <div className="flex flex-wrap items-center gap-2 whitespace-nowrap">
      {role === "MEDECIN" ? (
        medecinRowState(req) === "a-decider" ? (
          <>
            <button
              onClick={() => router.push(`/decisions-anesthesie/${encodeURIComponent(req.id)}?tab=${medecinTab}`)}
              className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-white transition-all duration-200 hover:opacity-90"
            >
              Décider
            </button>
            <button
              onClick={() => handleDetail(req.id)}
              className="rounded-lg border border-outline-variant/20 bg-surface-container px-2.5 py-1 text-[11px] font-bold text-on-surface-variant transition-all duration-200 hover:bg-surface-container-high"
            >
              Détails
            </button>
          </>
        ) : medecinRowState(req) === "pret" ? (
          <>
            <TreatButton
              patient={req.originalName}
              id={req.id}
              rendezVousId={req.rendezVous?.id}
              prescriptionId={req.id}
              patientId={req.patientId}
              procedure={req.procedure}
            />
            <button
              onClick={() => handleDetail(req.id)}
              className="rounded-lg border border-outline-variant/20 bg-surface-container px-2.5 py-1 text-[11px] font-bold text-on-surface-variant transition-all duration-200 hover:bg-surface-container-high"
            >
              Détails
            </button>
          </>
        ) : medecinRowState(req) === "cpa-bloquee" ? (
          <>
            <span className="inline-flex items-center gap-1 rounded-lg bg-error-container px-2.5 py-1 text-[11px] font-bold text-error">
              <span className="material-symbols-outlined text-[14px]">block</span>
              {req.dossierCPA?.decisionCpa === "REPORT" ? "CPA reportée" : "CPA défavorable"}
            </span>
            <button
              onClick={() => handleDetail(req.id)}
              className="rounded-lg border border-outline-variant/20 bg-surface-container px-2.5 py-1 text-[11px] font-bold text-on-surface-variant transition-all duration-200 hover:bg-surface-container-high"
            >
              Détails
            </button>
          </>
        ) : (
          <button
            onClick={() => handleDetail(req.id)}
            className="rounded-lg border border-outline-variant/20 bg-surface-container px-2.5 py-1 text-[11px] font-bold text-on-surface-variant transition-all duration-200 hover:bg-surface-container-high"
          >
            Détails
          </button>
        )
      ) : req.status === "Décision rendue" && req.rendezVous?.typeAnesthesie === "Locale" ? (
        <button
          disabled={confirmingId === req.id}
          onClick={() => handleEnvoyerConfirmation(req)}
          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
        >
          {confirmingId === req.id ? "Envoi…" : "Envoyer la confirmation"}
        </button>
      ) : req.status === "Décision rendue" && req.rendezVous?.typeAnesthesie === "Générale" ? (
        <button
          onClick={() => handleDemandeCpaFromFil(req)}
          className="rounded-lg bg-[#EA580C] px-2.5 py-1 text-[11px] font-bold text-white transition-all duration-200 hover:opacity-90"
        >
          Demande CPA
        </button>
      ) : req.status === "A planifier" ? (
        <>
          <button
            onClick={() => handlePlanifier(req, group)}
            className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-white transition-all duration-200 hover:opacity-90"
          >
            Planifier
          </button>
          <button
            onClick={() => handleDetail(req.id)}
            className="rounded-lg border border-outline-variant/20 bg-surface-container px-2.5 py-1 text-[11px] font-bold text-on-surface-variant transition-all duration-200 hover:bg-surface-container-high"
          >
            Détails
          </button>
        </>
      ) : req.status === "CPA demandée" && req.dossierCPA?.id ? (
        <>
          <button
            disabled={verifyingCpaId === req.id}
            onClick={() => handleVerifierStatutCpa(req)}
            title="Interroger le Bloc Opératoire (filet de sécurité si la notification automatique n'est pas arrivée)"
            className="rounded-lg border border-outline-variant/20 bg-surface-container px-2.5 py-1 text-[11px] font-bold text-primary transition-all duration-200 hover:bg-surface-container-high disabled:opacity-50"
          >
            {verifyingCpaId === req.id ? "Vérification…" : "Vérifier statut CPA"}
          </button>
          <button
            onClick={() => handleDetail(req.id)}
            className="rounded-lg border border-outline-variant/20 bg-surface-container px-2.5 py-1 text-[11px] font-bold text-on-surface-variant transition-all duration-200 hover:bg-surface-container-high"
          >
            Détails
          </button>
        </>
      ) : (
        // Planifié / Confirmé : déjà pris en charge,
        // le patient reste visible mais sans action de planification.
        <button
          onClick={() => handleDetail(req.id)}
          className="rounded-lg border border-outline-variant/20 bg-surface-container px-2.5 py-1 text-[11px] font-bold text-on-surface-variant transition-all duration-200 hover:bg-surface-container-high"
        >
          Détails
        </button>
      )}
    </div>
  );

  const baseFiltered = useMemo(() => {
    if (role === "MEDECIN") {
      if (medecinTab === "tous") return allRequests;
      return allRequests.filter((p) => medecinRowState(p) === medecinTab);
    }
    return allRequests.filter((p) => MAJOR_TRACKED_STATUTS.has(p.status));
  }, [allRequests, role, medecinTab]);

  const priorityRequests = useMemo(
    () =>
      baseFiltered.slice().sort((a, b) => {
        // Le jour d'abord (du plus récent au plus ancien) — tous les patients du jour
        // le plus récent passent avant ceux de la veille, même si l'un d'eux est plus
        // urgent. L'urgence ne départage qu'à l'intérieur d'un même jour.
        const dayA = a.dateDemandeRaw ? new Date(a.dateDemandeRaw).setHours(0, 0, 0, 0) : 0;
        const dayB = b.dateDemandeRaw ? new Date(b.dateDemandeRaw).setHours(0, 0, 0, 0) : 0;
        if (dayA !== dayB) return dayB - dayA;
        return a.priorityRank - b.priorityRank;
      }),
    [baseFiltered],
  );

  // Regroupe les demandes qui partagent la même prescription externe multi-examens
  // (ex: un patient qui doit faire une coloscopie ET une fibroscopie) en une seule
  // ligne dans le tableau — chaque examen garde son propre statut et ses propres
  // actions (planification, décision...), voir le rendu du tableau plus bas.
  const groupedRequests = useMemo(() => {
    const groups = new Map<string, any[]>();
    const order: string[] = [];
    for (const req of priorityRequests) {
      const key = req.prescriptionExternalId || `single-${req.id}`;
      if (!groups.has(key)) {
        groups.set(key, []);
        order.push(key);
      }
      groups.get(key)!.push(req);
    }
    return order.map((key) => groups.get(key)!);
  }, [priorityRequests]);

  const totalEnAttente = priorityRequests.length;
  // Compté par patient distinct ayant au moins une procédure TRES URGENT dans le fil,
  // pas par procédure — un même patient avec 2 examens TRES URGENT ne compte qu'une fois.
  const totalUrgents = new Set(
    priorityRequests
      .filter((p) => (p.priority || "").toUpperCase() === "STAT")
      .map((p) => p.patientId),
  ).size;
  const tauxTraitement = allRequests.length > 0
    ? Math.round(((allRequests.length - baseFiltered.length) / allRequests.length) * 100)
    : 0;

  // Salles réellement configurées (actives) — se met à jour automatiquement
  // avec le rafraîchissement périodique dès qu'une salle est ajoutée/modifiée.
  const sallesDisponibles = salles.filter((s: any) => s.estActive !== false);

  const showStatutColumn = role !== "MEDECIN" || medecinTab === "tous";

  const columnWidths = showStatutColumn
    ? ["9%", "16%", "14%", "12%", "16%", "14%", "19%"]
    : ["10%", "19%", "17%", "15%", "18%", "21%"];

  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
          <PageToolbar
            actions={
            <div className="flex gap-3 relative">
              <button
                ref={filterButtonRef}
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 font-semibold transition-all ${
                  showFilters
                    ? "bg-primary text-white border-primary shadow-md"
                    : "border-outline-variant/10 bg-surface-container text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-lg">filter_list</span>
                Filtrer
                {(filters.nom || filters.procedure || filters.medecin || filters.date) && (
                  <span className="w-2 h-2 rounded-full bg-red-400 absolute -top-1 -right-1 animate-pulse" />
                )}
              </button>

              {showFilters && (
                <div ref={filterPanelRef} className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-outline-variant/10 p-5 z-30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                  <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
                    <h5 className="font-bold text-sm">Filtres de recherche</h5>
                    <button
                      onClick={() => {
                        setFilters({ nom: "", procedure: "", medecin: "", date: "" });
                      }}
                      className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline"
                    >
                      Réinitialiser
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        Nom du Patient
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">person</span>
                        <input
                          className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg pl-9 pr-4 py-2 text-xs font-medium focus:ring-2 focus:ring-primary/20 text-on-surface"
                          type="text"
                          placeholder="Rechercher un patient..."
                          value={filters.nom}
                          onChange={(e) => setFilters({...filters, nom: e.target.value})}
                          onKeyDown={handleFilterKeyDown}
                        />
                      </div>
                    </div>

                    <SelectFilter
                      label="Procédure"
                      icon="medical_services"
                      value={filters.procedure}
                      onChange={(v) => setFilters({ ...filters, procedure: v })}
                      options={examTypes.map((t) => ({ value: t.name, label: t.name }))}
                    />

                    <ComboboxFilter
                      label="Médecin Prescripteur"
                      icon="stethoscope"
                      value={filters.medecin}
                      onChange={(v) => setFilters({ ...filters, medecin: v })}
                      options={doctorNames}
                      placeholder="Rechercher un médecin..."
                    />

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        Date de réception
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">calendar_today</span>
                        <input
                          className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg pl-9 pr-4 py-2 text-xs font-medium focus:ring-2 focus:ring-primary/20 text-on-surface"
                          type="date"
                          value={filters.date}
                          onChange={(e) => {
                            setFilters({...filters, date: e.target.value});
                            setShowFilters(false);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  fetchPrescriptions();
                  closeFilterPanel();
                }}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                <span className="material-symbols-outlined text-lg">sync</span>
                Actualiser
              </button>
            </div>
            }
          >
          </PageToolbar>

          {role === "MEDECIN" && (
            <div className="flex gap-2 border-b border-outline-variant/10">
              {MEDECIN_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setMedecinTab(tab.key)}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                    medecinTab === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Total En attente</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-headline font-extrabold text-blue-900">{totalEnAttente}</span>
                <span className="text-xs font-medium text-blue-700/70">{priorityRequests.length} demandes</span>
              </div>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">TRES URGENT</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-headline font-extrabold text-blue-900">{String(totalUrgents).padStart(2, "0")}</span>
                <span className="text-xs font-medium text-blue-700/70">Priorité immédiate</span>
              </div>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Salles Disponibles</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-headline font-extrabold text-blue-900">{String(sallesDisponibles.length).padStart(2, "0")}</span>
                <span className="text-xs font-medium text-blue-700/70 truncate">Prêtes à l&apos;usage</span>
              </div>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Taux de traitement</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-headline font-extrabold text-blue-900">{tauxTraitement}%</span>
                <span className="text-xs font-medium text-blue-700/70">Efficacité</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 space-y-3 lg:col-span-12">
              <h3 className="flex items-center gap-2 text-base font-bold font-headline">
                <span className="h-5 w-1.5 rounded-full bg-error" />
                Demandes Prioritaires
              </h3>

              {confirmError && (
                <div className="rounded-xl border border-error/20 bg-error-container/10 px-4 py-2.5 text-sm text-error">
                  {confirmError}
                </div>
              )}

              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
                </div>
              ) : error ? (
                <div className="rounded-xl border border-error/20 bg-error-container/10 p-6 text-center">
                  <span className="material-symbols-outlined text-4xl text-error mb-2">cloud_off</span>
                  <h4 className="text-lg font-bold text-error">Erreur de connexion</h4>
                  <p className="text-on-surface-variant mb-4">{error}</p>
                  <button
                    onClick={() => fetchPrescriptions()}
                    className="rounded-lg bg-error px-4 py-2 text-sm font-bold text-white hover:opacity-90"
                  >
                    Réessayer
                  </button>
                </div>
              ) : priorityRequests.length === 0 ? (
                <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8 text-center">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">inbox</span>
                  <p className="text-on-surface-variant">
                    {role === "MEDECIN" ? "Aucun patient dans cette vue." : "Aucune prescription en attente."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-outline-variant/10 bg-white shadow-sm">
                  <table className="w-full table-fixed border-collapse text-left text-sm">
                    <colgroup>
                      {columnWidths.map((w, i) => (
                        <col key={i} style={{ width: w }} />
                      ))}
                    </colgroup>
                    <thead className="bg-surface-container-lowest text-xs uppercase tracking-wider text-on-surface-variant">
                      <tr>
                        <th className="px-4 py-2.5">Reçu</th>
                        <th className="px-4 py-2.5">Patient</th>
                        <th className="px-4 py-2.5">Procédure</th>
                        <th className="px-4 py-2.5">Médecin</th>
                        <th className="px-4 py-2.5">Urgence</th>
                        {showStatutColumn && <th className="px-4 py-2.5">Statut</th>}
                        <th className="px-4 py-2.5">Actions</th>
                      </tr>
                    </thead>
                  </table>
                  <div>
                    <table className="w-full table-fixed border-collapse text-left text-sm">
                      <colgroup>
                        {columnWidths.map((w, i) => (
                          <col key={i} style={{ width: w }} />
                        ))}
                      </colgroup>
                      <tbody>
                        {groupedRequests
                          .filter((group) => group.some((req) => {
                            const matchesNom = req.name.toLowerCase().includes(filters.nom.toLowerCase());
                            const matchesProc = req.procedure.toLowerCase().includes(filters.procedure.toLowerCase());
                            const matchesMed = req.prescriber.toLowerCase().includes(filters.medecin.toLowerCase());
                            const matchesDate = filters.date ? req.receivedTime.includes(new Date(filters.date).toLocaleDateString("fr-FR")) : true;
                            return matchesNom && matchesProc && matchesMed && matchesDate;
                          }))
                          .map((group) => {
                            const primary = group[0];
                            const isGrouped = group.length > 1;
                            const combinedProcedure = group.map((r) => r.procedure).join(" + ");
                            // L'examen qui a le plus besoin d'une action, pour que le bouton
                            // unique de la ligne groupée ne masque pas un examen encore en
                            // attente juste parce que le premier de la liste est déjà traité.
                            const actionableReq =
                              group.find((r) => r.status === "A planifier") ||
                              group.find((r) => medecinRowState(r) === "a-decider") ||
                              group.find((r) => medecinRowState(r) === "pret") ||
                              group.find((r) => medecinRowState(r) === "cpa-bloquee") ||
                              primary;
                            return (
                        <tr key={primary.prescriptionExternalId || primary.id} className={`border-t border-outline-variant/10 hover:bg-surface-container/50 ${priseEnChargeStripeClass(!!primary.priseEnChargeId)}`}>
                          <td className="px-4 py-2.5 text-on-surface-variant truncate" title={primary.receivedTime}>{primary.receivedTime}</td>
                          <td className="px-4 py-2.5 font-semibold text-on-surface">
                            <div className="truncate" title={primary.name}>{primary.name}</div>
                            <PriseEnChargeBadge priseEnChargeId={primary.priseEnChargeId} className="mt-0.5" />
                          </td>
                          <td className="px-4 py-2.5" title={combinedProcedure}>
                            <div className="flex flex-wrap gap-1">
                              {group.map((r, i) => {
                                const badgeClass = `inline-flex max-w-full items-center gap-1 truncate rounded-full px-2 py-1 text-[11px] font-bold ${getExamTypeBadgeClass(r.procedure)}`;
                                // Examen déjà planifié dans ce groupe multi-examens : cliquable pour
                                // retrouver immédiatement la date/heure enregistrée (ex. si l'utilisateur
                                // a oublié le créneau donné pour ce premier examen).
                                if (r.status !== "A planifier") {
                                  const rdvLabel = r.rendezVous?.dateHeureDebut
                                    ? `Planifié le ${new Date(r.rendezVous.dateHeureDebut).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}${r.rendezVous.salle?.nom ? ` — ${r.rendezVous.salle.nom}` : ""}`
                                    : STATUS_LABELS[r.status] || r.status;
                                  return (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => handleDetail(r.id)}
                                      title={`${r.procedure} — ${rdvLabel}`}
                                      className={`${badgeClass} hover:brightness-95 hover:ring-2 hover:ring-offset-1 cursor-pointer transition-all`}
                                    >
                                      <span className="material-symbols-outlined text-[13px] shrink-0">event_available</span>
                                      <span className="truncate">{r.procedure}</span>
                                    </button>
                                  );
                                }
                                return (
                                  <span key={i} className={badgeClass}>
                                    <span className="material-symbols-outlined text-[13px] shrink-0">medical_services</span>
                                    <span className="truncate">{r.procedure}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-on-surface-variant truncate" title={primary.prescriber}>{primary.prescriber}</td>
                          <td className="px-4 py-2.5">
                            {primary.priority === "STAT" ? (
                              <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-red-600 px-2 py-1 text-[10px] font-bold text-white uppercase tracking-normal animate-pulse shadow-md">
                                <span className="material-symbols-outlined text-[13px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                                <span className="truncate">TRES URGENT</span>
                              </span>
                            ) : (
                              <span className={`inline-flex max-w-full items-center gap-1 truncate rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-wider ${primary.priorityIndicatorClass}`}>
                                {primary.priorityIndicatorIcon ? (
                                  <span className="material-symbols-outlined text-[14px] shrink-0">{primary.priorityIndicatorIcon}</span>
                                ) : null}
                                {primary.priorityIndicator}
                              </span>
                            )}
                          </td>
                          {showStatutColumn && (
                            <td className="px-4 py-2.5">
                              {isGrouped ? (
                                (() => {
                                  const planifiesCount = group.filter((r) => r.status !== "A planifier").length;
                                  const label = `${planifiesCount}/${group.length} planifiés`;
                                  const detail = group.map((r) => `${r.procedure} : ${STATUS_LABELS[r.status] || r.status}`).join("\n");
                                  return (
                                    <span className="inline-flex max-w-full items-center truncate rounded-full bg-surface-container px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant" title={detail}>
                                      {label}
                                    </span>
                                  );
                                })()
                              ) : primary.status === "Décision rendue" ? (
                                <button
                                  type="button"
                                  onClick={() => openDecisionModal(primary)}
                                  title="Cliquer pour maintenir ou décaler la date prévue"
                                  className="flex w-full flex-col items-start gap-0.5 rounded-lg bg-primary/10 px-2 py-1 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                                >
                                  <span className="text-[9px] font-bold uppercase tracking-wide leading-tight">
                                    Décision rendue
                                  </span>
                                  <span className="text-[9px] font-semibold uppercase tracking-wide leading-tight opacity-80">
                                    Anesthésie {primary.rendezVous?.typeAnesthesie || "?"}
                                  </span>
                                </button>
                              ) : (
                                <span className="inline-flex max-w-full items-center truncate rounded-full bg-surface-container px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant" title={STATUS_LABELS[primary.status] || primary.status}>
                                  {STATUS_LABELS[primary.status] || primary.status}
                                </span>
                              )}
                            </td>
                          )}
                          <td className="px-4 py-2.5">
                            {renderActions(actionableReq, group)}
                          </td>
                        </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>
      </div>

      {decisionReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Décision rendue — {decisionReq.rendezVous?.typeAnesthesie || "?"}
                </p>
                <h3 className="text-lg font-black text-on-surface mt-0.5">{decisionReq.originalName || decisionReq.name}</h3>
                {decisionReq.rendezVous?.dateHeureDebut && (
                  <p className="text-sm text-on-surface-variant mt-1">
                    Rendez-vous prévu le{" "}
                    {new Date(decisionReq.rendezVous.dateHeureDebut).toLocaleString("fr-FR", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeDecisionModal}
                className="text-on-surface-variant hover:text-on-surface shrink-0"
                aria-label="Fermer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {decisionMode === "choix" ? (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={closeDecisionModal}
                  className="w-full rounded-xl border-2 border-primary px-4 py-3 text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
                >
                  Maintenir la date prévue
                </button>
                <button
                  type="button"
                  onClick={() => setDecisionMode("decaler")}
                  className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
                >
                  Décaler la date
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Nouvelle date</label>
                    <input
                      type="date"
                      value={decisionDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setDecisionDate(e.target.value)}
                      className="bg-surface-container-low rounded-lg px-3 py-2 text-sm font-bold text-on-surface border-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Nouvelle heure</label>
                    <input
                      type="time"
                      value={decisionHeure}
                      onChange={(e) => setDecisionHeure(e.target.value)}
                      className="bg-surface-container-low rounded-lg px-3 py-2 text-sm font-bold text-on-surface border-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                {decisionError && <p className="text-sm text-error">{decisionError}</p>}
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDecisionMode("choix")}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    disabled={isDecisionSaving || !decisionDate || !decisionHeure}
                    onClick={handleConfirmDecalage}
                    className="px-5 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isDecisionSaving ? "Décalage…" : "Confirmer le décalage"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function PrescriptionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Chargement...</div>}>
      <PrescriptionsContent />
    </Suspense>
  );
}
