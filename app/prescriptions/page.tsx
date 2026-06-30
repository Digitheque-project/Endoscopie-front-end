"use client";

import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { apiJson, updateRendezVous } from "@/lib/api";
import SelectFilter from "@/components/ui/SelectFilter";
import ComboboxFilter from "@/components/ui/ComboboxFilter";
import TreatButton from "@/components/navigation/TreatButton";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, useRef, type KeyboardEvent } from "react";
import { usePatient } from "@/contexts/PatientContext";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_LABELS: Record<string, string> = {
  "Planifié": "En attente de décision médecin",
  "Confirmé": "Confirmé — RDV planifié",
  "CPA demandée": "CPA en attente du bloc opératoire",
};

const EXCLUDED_RDV_STATUTS = new Set(["Annulé", "Terminé"]);
const MAJOR_TRACKED_STATUTS = new Set([
  "A planifier",
  "Planifié",
  "Décision rendue",
  "Confirmé",
  "CPA demandée",
]);

type MedecinTab = "a-decider" | "pret" | "tous";
const MEDECIN_TABS: { key: MedecinTab; label: string }[] = [
  { key: "a-decider", label: "À décider" },
  { key: "pret", label: "Prêt pour l'examen" },
  { key: "tous", label: "Tous" },
];

function medecinRowState(req: any): MedecinTab | "autre" {
  if (!req.rendezVous) return "autre";
  if (!req.rendezVous.typeAnesthesie) return "a-decider";
  if (EXCLUDED_RDV_STATUTS.has(req.rendezVous.statut)) return "autre";
  if (req.checklistApresValide) return "autre";
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const initialTab = (searchParams.get("tab") as MedecinTab) || "a-decider";
  const [medecinTab, setMedecinTab] = useState<MedecinTab>(
    MEDECIN_TABS.some((t) => t.key === initialTab) ? initialTab : "a-decider",
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
    else if (prioriteUpper === "URGENT" || prioriteUpper === "URGENCE" || prioriteUpper === "PRIORITAIRE") score += 20;
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

  const getPriorityIndicator = (rawPriority: string, level: string) => {
    const p = rawPriority.toUpperCase();
    if (p === "STAT" || p === "URGENCE VITALE") {
      return {
        label: p === "STAT" ? "STAT" : "Urgent Vital",
        icon: "warning",
        className: "bg-red-600 text-white animate-pulse font-bold",
      };
    }
    if (level === "Élevée" || p === "URGENT" || p === "URGENCE") {
      return { label: "Urgent", icon: "priority_high", className: "bg-[#EA580C] hover:bg-[#C2410C] active:scale-95 transition-all text-white font-bold shadow-sm" };
    }
    if (level === "Moyenne" || p === "PRIORITAIRE") {
      return { label: "Prioritaire", icon: "warning", className: "bg-amber-400 text-black font-bold" };
    }
    return { label: "Normale", icon: "check_circle", className: "bg-surface-container text-on-surface-variant" };
  };

  const fetchPrescriptions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [data, docsData, examTypesData] = await Promise.all([
        apiJson<any[]>('/api/prescriptions'),
        apiJson<any[]>('/api/medecins'),
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
        const indicator = getPriorityIndicator(prioriteUpper, priorityLevel);

        return {
          id: p.id,
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
        };
      });

      setAllRequests(mapped);
    } catch (error: any) {
      console.error("Erreur de récupération des prescriptions:", error);
      setError("Impossible de contacter le serveur. Veuillez vérifier que le backend est lancé.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
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
    router.push(`/patient-dossier/${encodeURIComponent(id)}`);
  };

  const handlePlanifier = (req: any) => {
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

  const handleDemandeCpaFromFil = (req: any) => {
    const params = new URLSearchParams();
    if (req.patientId) params.set("patientId", String(req.patientId));
    if (req.id) params.set("prescriptionId", String(req.id));
    if (req.originalName) params.set("patientName", String(req.originalName));
    else if (req.name) params.set("patientName", String(req.name));
    if (req.procedure) params.set("procedure", String(req.procedure));
    router.push(`/demande-cpa?${params.toString()}`);
  };

  const baseFiltered = useMemo(() => {
    if (role === "MEDECIN") {
      if (medecinTab === "tous") return allRequests;
      return allRequests.filter((p) => medecinRowState(p) === medecinTab);
    }
    return allRequests.filter((p) => MAJOR_TRACKED_STATUTS.has(p.status));
  }, [allRequests, role, medecinTab]);

  const priorityRequests = useMemo(
    () => baseFiltered.slice().sort((a, b) => b.urgencyScore - a.urgencyScore),
    [baseFiltered],
  );

  const totalEnAttente = priorityRequests.length;
  const totalUrgents = priorityRequests.filter((p) => (p.priority || "").toUpperCase() === "STAT").length;
  const tauxTraitement = allRequests.length > 0
    ? Math.round(((allRequests.length - baseFiltered.length) / allRequests.length) * 100)
    : 0;

  const showStatutColumn = role !== "MEDECIN" || medecinTab === "tous";

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
            <div className="rounded-lg border border-outline-variant/5 bg-surface-container-lowest p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total En attente</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-headline font-extrabold text-primary">{totalEnAttente}</span>
                <span className="text-xs font-medium text-on-surface-variant">{priorityRequests.length} demandes</span>
              </div>
            </div>
            <div className="rounded-lg border border-outline-variant/5 bg-surface-container-lowest p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Urgents (STAT)</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-headline font-extrabold text-tertiary">{String(totalUrgents).padStart(2, "0")}</span>
                <span className="text-xs font-medium text-on-surface-variant">Priorité immédiate</span>
              </div>
            </div>
            <div className="rounded-lg border border-outline-variant/5 bg-surface-container-lowest p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Salles Disponibles</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-headline font-extrabold text-secondary">02</span>
                <span className="text-xs font-medium text-on-surface-variant">Salle 4 &amp; 5</span>
              </div>
            </div>
            <div className="rounded-lg border border-outline-variant/5 bg-surface-container-lowest p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Taux de traitement</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-headline font-extrabold text-secondary">{tauxTraitement}%</span>
                <span className="text-xs font-medium text-on-surface-variant">Efficacité</span>
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
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="bg-surface-container-lowest text-xs uppercase tracking-wider text-on-surface-variant">
                      <tr>
                        <th className="px-4 py-2.5">Reçu</th>
                        <th className="px-4 py-2.5">Patient</th>
                        <th className="px-4 py-2.5">Procédure</th>
                        <th className="px-4 py-2.5">Clinique</th>
                        <th className="px-4 py-2.5">Urgence</th>
                        {showStatutColumn && <th className="px-4 py-2.5">Statut</th>}
                        <th className="px-4 py-2.5">Actions</th>
                      </tr>
                    </thead>
                  </table>
                  <div>
                    <table className="min-w-full border-collapse text-left text-sm">
                      <tbody>
                        {priorityRequests
                          .filter(req => {
                            const matchesNom = req.name.toLowerCase().includes(filters.nom.toLowerCase());
                            const matchesProc = req.procedure.toLowerCase().includes(filters.procedure.toLowerCase());
                            const matchesMed = req.prescriber.toLowerCase().includes(filters.medecin.toLowerCase());
                            const matchesDate = filters.date ? req.receivedTime.includes(new Date(filters.date).toLocaleDateString("fr-FR")) : true;
                            return matchesNom && matchesProc && matchesMed && matchesDate;
                          })
                          .map((req) => (
                        <tr key={req.id} className="border-t border-outline-variant/10 hover:bg-surface-container/50">
                          <td className="px-4 py-2.5 text-on-surface-variant">{req.receivedTime}</td>
                          <td className="px-4 py-2.5 font-semibold text-on-surface">{req.name}</td>
                          <td className="px-4 py-2.5 text-on-surface-variant">{req.procedure}</td>
                          <td className="px-4 py-2.5 text-on-surface-variant">{req.prescriber}</td>
                          <td className="px-4 py-2.5">
                            {req.priority === "STAT" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider animate-pulse shadow-md">
                                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                                <span>STAT</span>
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-wider ${req.priorityIndicatorClass}`}>
                                {req.priorityIndicatorIcon ? (
                                  <span className="material-symbols-outlined text-[14px]">{req.priorityIndicatorIcon}</span>
                                ) : null}
                                {req.priorityIndicator}
                              </span>
                            )}
                          </td>
                          {showStatutColumn && (
                            <td className="px-4 py-2.5">
                              <span className="inline-flex items-center rounded-full bg-surface-container px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                                {req.status === "Décision rendue"
                                  ? `Décision rendue — ${req.rendezVous?.typeAnesthesie || "?"}`
                                  : (STATUS_LABELS[req.status] || req.status)}
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-2.5">
                            <div className="flex flex-wrap items-center gap-2 whitespace-nowrap">
                              {role === "MEDECIN" ? (
                                medecinRowState(req) === "a-decider" ? (
                                  <button
                                    onClick={() => router.push(`/decisions-anesthesie/${encodeURIComponent(req.id)}`)}
                                    className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-white transition-all duration-200 hover:opacity-90"
                                  >
                                    Décider
                                  </button>
                                ) : medecinRowState(req) === "pret" ? (
                                  <TreatButton
                                    patient={req.originalName}
                                    id={req.id}
                                    rendezVousId={req.rendezVous?.id}
                                    prescriptionId={req.id}
                                    patientId={req.patientId}
                                    procedure={req.procedure}
                                  />
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
                                    onClick={() => handlePlanifier(req)}
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
                              ) : (
                                // Planifié / Confirmé / CPA demandée : déjà pris en charge,
                                // le patient reste visible mais sans action de planification.
                                <button
                                  onClick={() => handleDetail(req.id)}
                                  className="rounded-lg border border-outline-variant/20 bg-surface-container px-2.5 py-1 text-[11px] font-bold text-on-surface-variant transition-all duration-200 hover:bg-surface-container-high"
                                >
                                  Détails
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>
      </div>
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
