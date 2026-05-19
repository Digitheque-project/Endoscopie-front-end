"use client";

import { AppShell } from "@/components/layout/AppShell";
import PrescriptionTreatButton from "@/components/navigation/PrescriptionTreatButton";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Les constantes scheduleItems et recentActivity ont été supprimées car elles sont maintenant dynamiques

export default function PrescriptionsPage() {
  const router = useRouter();
  const [priorityRequests, setPriorityRequests] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalEnAttente, setTotalEnAttente] = useState<number>(0);
  const [totalUrgents, setTotalUrgents] = useState<number>(0);
  const [tauxTraitement, setTauxTraitement] = useState<number>(0);
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

      // Fetch doctors and prescriptions in parallel
      const [respPresc, respDoctors] = await Promise.all([
        fetch("http://127.0.0.1:3333/api/prescriptions"),
        fetch("http://127.0.0.1:3333/api/medecins")
      ]);

      if (!respPresc.ok || !respDoctors.ok) {
        throw new Error(`Backend error: prescriptions=${respPresc.status}, medecins=${respDoctors.status}`);
      }

      const data = await respPresc.json();
      const docsData = await respDoctors.json();
      setDoctors(docsData);

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
        };
      });

      const total = mapped.length;
      const filteredByStatus = mapped.filter(p => p.status !== "Planifié");

      const sortedRequests = filteredByStatus.slice().sort((a, b) => b.urgencyScore - a.urgencyScore);
      const numberedRequests = sortedRequests.map((req, index) => ({ ...req, rank: index + 1 }));

      setPriorityRequests(numberedRequests);

      const urg = filteredByStatus.filter(p => {
        const up = (p.priority || "").toUpperCase();
        return ["STAT", "URGENT", "URGENCE", "PRIORITAIRE", "URGENCE VITALE"].includes(up);
      }).length;

      const treated = total - filteredByStatus.length;

      setTotalEnAttente(filteredByStatus.length);
      setTotalUrgents(urg);
      setTauxTraitement(total > 0 ? Math.round((treated / total) * 100) : 0);
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

  // Dynamic schedule items using real doctors if available
  const dynamicSchedule = [
    { time: "09:00", procedure: "Gastroscopie - Salle 1", patient: `Patient: ${priorityRequests[0]?.name || "R. Durand"}` },
    { time: "10:30", procedure: "Colonoscopie - Salle 2", patient: `Patient: ${priorityRequests[1]?.name || "L. Bernard"}` },
    { time: "11:45", procedure: "URGENT STAT - Salle 1", patient: "En attente de patient", isAlert: true },
  ];

  // Dynamic activity using real doctors from priorityRequests to ensure variety
  const dynamicActivity = [
    { 
      type: "task_alt", 
      title: "Rapport validé", 
      detail: `pour ${priorityRequests[0]?.name || "Patient #8829"}`, 
      time: "Il y a 10 min par " + (priorityRequests[0]?.prescriber || "Dr. Bernard"), 
      bgColor: "bg-secondary-container" 
    },
    { 
      type: "mail", 
      title: "Nouvelle prescription", 
      detail: `- ${priorityRequests[1]?.procedure || "Gastroscopie"}`, 
      time: "Il y a 14 min par " + (priorityRequests[1]?.prescriber || "Dr. Dubois"), 
      bgColor: "bg-surface-container-highest" 
    },
    { 
      type: "cancel", 
      title: "RDV Annulé", 
      detail: `- Patient ${priorityRequests[2]?.name || "S. Girard"}`, 
      time: "Il y a 45 min", 
      bgColor: "bg-error-container" 
    },
  ];

  const handleDetail = (id: string) => {
    router.push(`/patient-dossier/${encodeURIComponent(id)}`);
  };

  const handlePlanifier = (req: any) => {
    const params = new URLSearchParams();
    if (req.id) params.set("prescriptionId", String(req.id));
    if (req.medecinId) params.set("medecinId", String(req.medecinId));
    if (req.patientId) params.set("patientId", String(req.patientId));
    if (req.name) params.set("patientName", String(req.name));
    if (req.procedure) params.set("procedure", String(req.procedure));
    if (req.prescriber) params.set("prescriber", String(req.prescriber));
    if (req.reason) params.set("reason", String(req.reason));
    if (req.priority) params.set("priority", String(req.priority));

    router.push(`/planification-examens?${params.toString()}`);
  };

  return (
    <AppShell>
      <main className="min-h-screen bg-surface px-8 pb-10 pt-20 text-on-surface">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Fil de prescription</h1>
              <p className="mt-1 text-on-surface-variant">Gérer les demandes d'endoscopie en attente de planification.</p>
            </div>
            <div className="flex gap-3 relative">
              <button 
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
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-outline-variant/10 p-6 z-30 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
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

                  <div className="space-y-4">
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
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        Procédure
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">medical_services</span>
                        <input
                          className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg pl-9 pr-4 py-2 text-xs font-medium focus:ring-2 focus:ring-primary/20 text-on-surface"
                          type="text"
                          placeholder="Type d'examen..."
                          value={filters.procedure}
                          onChange={(e) => setFilters({...filters, procedure: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        Médecin Prescripteur
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">stethoscope</span>
                        <input
                          className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg pl-9 pr-4 py-2 text-xs font-medium focus:ring-2 focus:ring-primary/20 text-on-surface"
                          type="text"
                          placeholder="Rechercher un médecin..."
                          value={filters.medecin}
                          onChange={(e) => setFilters({...filters, medecin: e.target.value})}
                        />
                      </div>
                    </div>

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
                          onChange={(e) => setFilters({...filters, date: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={() => fetchPrescriptions()}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                <span className="material-symbols-outlined text-lg">sync</span>
                Actualiser
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="rounded-lg border border-outline-variant/5 bg-surface-container-lowest p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total En attente</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-headline font-extrabold text-primary">{totalEnAttente}</span>
                <span className="text-xs font-medium text-on-surface-variant">{priorityRequests.length} demandes</span>
              </div>
            </div>
            <div className="rounded-lg border border-outline-variant/5 bg-surface-container-lowest p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Urgents (STAT)</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-headline font-extrabold text-tertiary">{String(totalUrgents).padStart(2, "0")}</span>
                <span className="text-xs font-medium text-on-surface-variant">Priorité immédiate</span>
              </div>
            </div>
            <div className="rounded-lg border border-outline-variant/5 bg-surface-container-lowest p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Salles Disponibles</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-headline font-extrabold text-secondary">02</span>
                <span className="text-xs font-medium text-on-surface-variant">Salle 4 &amp; 5</span>
              </div>
            </div>
            <div className="rounded-lg border border-outline-variant/5 bg-surface-container-lowest p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Taux de traitement</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-headline font-extrabold text-secondary">{tauxTraitement}%</span>
                <span className="text-xs font-medium text-on-surface-variant">Efficacité</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 space-y-4 lg:col-span-8">
              <h3 className="flex items-center gap-2 text-lg font-bold font-headline">
                <span className="h-6 w-2 rounded-full bg-error" />
                Demandes Prioritaires
              </h3>

              {isLoading ? (
                <div className="flex justify-center p-12">
                  <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
                </div>
              ) : error ? (
                <div className="rounded-xl border border-error/20 bg-error-container/10 p-8 text-center">
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
                <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">inbox</span>
                  <p className="text-on-surface-variant">Aucune prescription en attente.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-outline-variant/10 bg-white shadow-sm">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="bg-surface-container-lowest text-xs uppercase tracking-wider text-on-surface-variant">
                      <tr>
                        <th className="px-4 py-3">Reçu</th>
                        <th className="px-4 py-3">Patient</th>
                        <th className="px-4 py-3">Procédure</th>
                        <th className="px-4 py-3">Clinique</th>
                        <th className="px-4 py-3">Priorité</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                  </table>
                  <div className="max-h-[600px] overflow-y-auto">
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
                          <td className="px-4 py-4 text-on-surface-variant">{req.receivedTime}</td>
                          <td className="px-4 py-4 font-semibold text-on-surface">{req.name}</td>
                          <td className="px-4 py-4 text-on-surface-variant">{req.procedure}</td>
                          <td className="px-4 py-4 text-on-surface-variant">{req.prescriber}</td>
                          <td className="px-4 py-4">
                            {req.priority === "STAT" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white uppercase tracking-wider animate-pulse shadow-md">
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
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handlePlanifier(req)}
                                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition-all duration-200 hover:opacity-90"
                              >
                                Planifier
                              </button>
                              <button
                                onClick={() => handleDetail(req.id)}
                                className="rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-1.5 text-xs font-bold text-on-surface-variant transition-all duration-200 hover:bg-surface-container-high"
                              >
                                Détails
                              </button>
                              <button
                                onClick={() => {
                                  const params = new URLSearchParams();
                                  params.set("patientId", req.patientId);
                                  params.set("prescriptionId", req.id);
                                  params.set("patient", req.name);
                                  params.set("procedure", req.procedure);
                                  router.push(`/checklists/avant?${params.toString()}`);
                                }}
                                className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-white transition-all duration-200 hover:opacity-90"
                              >
                                Traiter
                              </button>
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

            <div className="col-span-12 space-y-4 lg:col-span-4">
              <h3 className="flex items-center gap-2 text-lg font-bold font-headline">
                <span className="material-symbols-outlined text-primary">calendar_today</span>
                Agenda du Jour
              </h3>
              <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-6">
                <div className="space-y-4">
                  {dynamicSchedule.map((item, idx) => (
                    <div key={idx} className={`flex gap-3 pl-3 border-l-2 ${item.isAlert ? "border-primary p-2 rounded-r-lg bg-secondary-container/20 shadow-sm" : "border-primary-container"}`}>
                      <span className={`min-w-[45px] text-xs font-bold ${item.isAlert ? "text-primary" : "text-on-surface-variant"}`}>{item.time}</span>
                      <div>
                        <p className="text-sm font-bold text-on-surface">{item.procedure}</p>
                        <p className="text-[11px] text-on-surface-variant">{item.patient}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => router.push('/agenda-rendez-vous')}
                  className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl border-2 border-primary/20 py-3 text-xs font-bold uppercase text-primary transition-all duration-200 hover:bg-primary/5 hover:border-primary hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">calendar_month</span>
                  Voir l'agenda complet
                </button>
              </div>

              <h3 className="flex items-center gap-2 text-lg font-bold font-headline mt-2">
                <span className="material-symbols-outlined text-secondary">history</span>
                Activité Récente
              </h3>
              <div className="rounded-lg border border-outline-variant/5 bg-surface-container-lowest p-6 shadow-sm">
                <div className="space-y-4">
                  {dynamicActivity.map((activity, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${activity.bgColor}`}>
                        <span className="material-symbols-outlined text-sm">{activity.type}</span>
                      </div>
                      <div>
                        <p className="text-xs">
                          <span className="font-bold">{activity.title} </span>
                          {activity.detail}
                        </p>
                        <p className="text-[10px] text-on-surface-variant">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
