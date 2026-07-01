"use client";

import Image from "next/image";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { apiFetch, apiJson } from "@/lib/api";
import TreatButton from "@/components/navigation/TreatButton";
import ProcedureCountsCard, { type ProcedureCount } from "@/components/dashboard/ProcedureCountsCard";
import SelectFilter from "@/components/ui/SelectFilter";
import ComboboxFilter from "@/components/ui/ComboboxFilter";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useRef, Fragment, type KeyboardEvent } from "react";

/** Date locale (YYYY-MM-DD) — cohérent avec le filtrage "aujourd'hui" côté backend. */
function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function Home() {
  const { role, medecinName } = useAuth();
  const greetingName = role === "MEDECIN" ? `Dr. ${medecinName}` : role === "MAJOR" ? "Major" : "";
  const [appointments, setAppointments] = useState<any[]>([]);
  const [salles, setSalles] = useState<any[]>([]);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [procedureCounts, setProcedureCounts] = useState<ProcedureCount[]>([]);
  const [isLoadingProcedureCounts, setIsLoadingProcedureCounts] = useState(true);
  const [newSalleData, setNewSalleData] = useState({
    nom: "",
    numero: "",
    capacite: "1",
    equipement: ""
  });

  const [filters, setFilters] = useState({
    nom: "",
    procedure: "",
    medecin: "",
    date: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  const [examTypes, setExamTypes] = useState<{ id: string; name: string }[]>([]);
  const [doctorNames, setDoctorNames] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [expandedDashboardStatusId, setExpandedDashboardStatusId] = useState<string | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const filterPanelRef = useRef<HTMLDivElement | null>(null);

  const fetchAppointments = async () => {
    try {
      const data = await apiJson<any[]>('/api/rendezvous');
      const mapped = data.map((rdv: any) => {
        const start = new Date(rdv.dateHeureDebut);
        const status = rdv.statut || "En attente";

        let statusClass = "bg-surface-container text-on-surface-variant";
        if (status === "En cours") statusClass = "bg-blue-100 text-blue-800";
        if (status === "Terminé") statusClass = "bg-emerald-100 text-success";
        if (status === "Priorité" || status === "Urgent") statusClass = "bg-[#EA580C] text-white font-bold animate-pulse";
        if (status === "Confirmé") statusClass = "bg-primary/10 text-primary font-bold";
        if (status === "Décision rendue") statusClass = "bg-amber-100 text-amber-800 font-bold";
        if (status === "CPA demandée") statusClass = "bg-violet-100 text-violet-800 font-bold";

        return {
          time: start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          patient: rdv.patient?.nom ? `${rdv.patient.prenom} ${rdv.patient.nom}` : (rdv.patientName || "Patient Inconnu"),
          id: `#END-${rdv.id.toString().slice(-4).toUpperCase()}`,
          realId: rdv.id,
          prescriptionId: rdv.prescriptionId || rdv.prescription?.id,
          patientRealId: rdv.patient?.id || rdv.patientId,
          procedure: rdv.prescription?.typeExamen || rdv.procedure || rdv.typeExamen || "Examen Endoscopique",
          doctor: rdv.medecin ? `Dr. ${rdv.medecin.nom}` : "Dr. Antoine Moreau",
          status: status,
          statusClass: statusClass,
          notesCliniques: rdv.notesCliniques || rdv.notes || "Dossier en cours",
          date: toLocalDateKey(start),
          rawStart: start,
          rawEnd: rdv.dateHeureFin ? new Date(rdv.dateHeureFin) : new Date(start.getTime() + 45 * 60000),
          salleId: rdv.salleId || rdv.salle?.id || null,
          salleName: rdv.salle?.nom || rdv.salle || "",
          hasCPA: !!rdv.prescription?.dossierCPA && rdv.prescription.dossierCPA.statut === "Valide",
          typeAnesthesie: rdv.typeAnesthesie || null,
        };
      });
      setAppointments(mapped);
      setApiError(null);
    } catch (e) {
      console.error("Error fetching appointments", e);
      setApiError("Impossible de joindre l'API. Démarrez le backend (npm run start:dev dans endoscopie-back).");
    }
  };

  const fetchProcedureCounts = async (showLoading = false) => {
    if (showLoading) setIsLoadingProcedureCounts(true);
    try {
      const data = await apiJson<{ procedure: string; count: number }[]>('/api/rendezvous/procedure-counts-today');
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => b.count - a.count || a.procedure.localeCompare(b.procedure))
        : [];
      setProcedureCounts(sorted);
    } catch (e) {
      console.error("Error fetching procedure counts", e);
    } finally {
      if (showLoading) setIsLoadingProcedureCounts(false);
    }
  };

  const filteredSchedule = appointments.filter(item => {
    const matchesNom = (item.patient || "").toLowerCase().includes((filters.nom || "").toLowerCase());
    const matchesProcedure = (item.procedure || "").toLowerCase().includes((filters.procedure || "").toLowerCase());
    const matchesMedecin = (item.doctor || "").toLowerCase().includes((filters.medecin || "").toLowerCase());
    const matchesDate = item.date === (filters.date || toLocalDateKey(new Date()));
    const matchesRole = role !== "MEDECIN" || item.status === "Décision rendue";
    return matchesNom && matchesProcedure && matchesMedecin && matchesDate && matchesRole;
  });

  const fetchSalles = async (showLoading = true) => {
    if (showLoading) setIsRefreshing(true);
    try {
      const data = await apiJson<any[]>('/api/salles');
      setSalles(Array.isArray(data) ? data : []);
      setLastUpdated(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setApiError(null);
    } catch (e) {
      console.error("Error fetching salles", e);
      setApiError("Impossible de joindre l'API. Démarrez le backend (npm run start:dev dans endoscopie-back).");
    } finally {
      if (showLoading) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSalles(true);
    fetchAppointments();
    fetchProcedureCounts(true);
    Promise.all([
      apiJson<any[]>('/api/medecins').catch(() => []),
      apiJson<{ id: string; name: string }[]>('/api/exam-types').catch(() => []),
    ]).then(([docs, types]) => {
      setDoctorNames((Array.isArray(docs) ? docs : []).map((d: any) => `Dr. ${d.prenom} ${d.nom}`.trim()));
      setExamTypes(Array.isArray(types) ? types : []);
    });
    const intervalId = setInterval(() => {
      fetchSalles(false);
      fetchAppointments();
      fetchProcedureCounts(false);
    }, 15000);
    return () => clearInterval(intervalId);
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

  const handleSaveSalle = async () => {
    console.log("handleSaveSalle: newSalleData", newSalleData);
    if (!newSalleData.nom || !newSalleData.numero) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiFetch('/api/salles', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSalleData),
      });

      console.log("handleSaveSalle: response status", response.status);
      if (response.ok) {
        setIsSuccess(true);
        setNewSalleData({ nom: "", numero: "", capacite: "1", equipement: "" });
        setShowAddRoom(false);

        // Refresh salles list
        try {
          const refreshData = await apiJson<any[]>('/api/salles');
          setSalles(Array.isArray(refreshData) ? refreshData : []);
          console.log("handleSaveSalle: refresh data", JSON.stringify(refreshData, null, 2));
        } catch (refreshError) {
          console.error("handleSaveSalle refresh error", refreshError);
        }

        setTimeout(() => setIsSuccess(false), 3000);
      } else {
        // Get error details from response
        let errorMessage = "Erreur lors de la création de la salle";
        try {
          const errorData = await response.json();
          console.log("handleSaveSalle: error response", JSON.stringify(errorData, null, 2));
          if (errorData.message) {
            errorMessage += `: ${errorData.message}`;
          }
        } catch (e) {
          // If we can't parse error response, show status
          console.error("handleSaveSalle: unable to parse error response", e);
          errorMessage += ` (Status: ${response.status})`;
        }
        alert(errorMessage);
        console.error("Server error:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert(`Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSalleStatus = (salle: any) => {
    const now = new Date();
    // Find if there's an appointment in this salle happening right now
    const activeRdv = appointments.find(rdv => {
      const isSameSalle = rdv.salleId === salle.id || rdv.salleName === salle.nom;
      const isHappeningNow = now >= rdv.rawStart && now <= rdv.rawEnd;
      return isSameSalle && isHappeningNow && rdv.status !== "Terminé" && rdv.status !== "Annulé";
    });

    if (activeRdv) {
      return {
        status: "En cours",
        statusClass: "text-primary",
        borderClass: "border-primary",
        icon: "surgical",
        description: `Examen: ${activeRdv.procedure} - ${activeRdv.patient}`
      };
    }

    return {
      status: "Disponible",
      statusClass: "text-emerald-600",
      borderClass: "border-emerald-100",
      icon: "check_circle",
      description: "Prêt pour le prochain examen"
    };
  };

  const validSalles = Array.isArray(salles) ? salles : [];

  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        {apiError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>Connexion API :</strong> {apiError}
          </div>
        )}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold text-on-surface tracking-tight">
                <span className="material-symbols-outlined text-primary text-xl">waving_hand</span>
                Bonjour{greetingName ? `, ${greetingName}` : ""}
              </h1>
              <p className="text-sm text-on-surface-variant mt-0.5">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())} • Unite d&#39;Endoscopie CHU ANDRAINJATO
              </p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <ProcedureCountsCard
              procedureCounts={procedureCounts}
              isLoading={isLoadingProcedureCounts}
            />

            <div className="col-span-12 md:col-span-6 text-on-primary p-4 rounded-xl border-none shadow-sm flex flex-col gap-3 bg-[#EA580C]">
              <div className="flex items-start justify-between">
                <p className="text-orange-50 text-sm font-semibold">Urgents Actifs</p>
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-lg">emergency</span>
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-white leading-none">
                {filteredSchedule.filter(a => a.status === 'Urgent' || a.status === 'Priorité').length.toString().padStart(2, '0')}
              </h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-12 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
              <h4 className="font-headline text-xl font-bold">Programme du jour</h4>
              <div className="flex gap-4 items-center relative">
                <button
                  ref={filterButtonRef}
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all font-semibold text-sm ${showFilters
                    ? "bg-primary text-white border-primary shadow-md"
                    : "bg-white border-outline-variant/30 text-on-surface hover:bg-surface-container-low"
                    }`}
                >
                  <span className="material-symbols-outlined text-lg">filter_list</span>
                  Filtrer
                  {(filters.nom || filters.procedure || filters.medecin) && (
                    <span className="w-2 h-2 rounded-full bg-red-400 absolute -top-1 -right-1 animate-pulse" />
                  )}
                </button>

                {showFilters && (
                  <div ref={filterPanelRef} className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-outline-variant/10 p-5 z-30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
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
                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant font-headline">
                          Nom du Patient
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">person</span>
                          <input
                            className="w-full bg-white border-2 border-primary rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold transition-all hover:ring-4 hover:ring-primary/10 focus:ring-4 focus:ring-primary/20 text-on-surface placeholder:text-slate-400 shadow-md outline-none"
                            type="text"
                            placeholder="Rechercher un patient..."
                            value={filters.nom}
                            onChange={(e) => setFilters({ ...filters, nom: e.target.value })}
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
                        label="Médecin"
                        icon="stethoscope"
                        value={filters.medecin}
                        onChange={(v) => setFilters({ ...filters, medecin: v })}
                        options={doctorNames}
                        placeholder="Rechercher un médecin..."
                      />

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant font-headline">
                          Date de consultation
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">calendar_today</span>
                          <input
                            className="w-full bg-white border-2 border-primary rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold transition-all hover:ring-4 hover:ring-primary/10 focus:ring-4 focus:ring-primary/20 text-on-surface placeholder:text-slate-400 shadow-md outline-none"
                            type="date"
                            value={filters.date}
                            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-visible">
              <div className="relative overflow-visible">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-surface-container-low/95 backdrop-blur-sm shadow-sm">
                  <tr className="bg-surface-container-low/50">
                    <th className="px-6 py-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      HEURE & PATIENT
                    </th>
                    <th className="px-6 py-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      PROCEDURE
                    </th>
                    <th className="px-6 py-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      MEDECIN
                    </th>
                    <th className="px-6 py-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      MOTIF
                    </th>
                    <th className="px-6 py-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      STATUT
                    </th>
                    <th className="px-6 py-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant text-right">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filteredSchedule.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">event_busy</span>
                          <p className="text-sm font-medium text-on-surface-variant">Il n'y a pas de rendez-vous aujourd'hui</p>
                          <button
                            onClick={() => setFilters({ nom: "", procedure: "", medecin: "", date: "" })}
                            className="text-xs font-bold text-primary hover:underline"
                          >
                            Réinitialiser les filtres
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSchedule.map((item) => (
                      <tr key={`${item.time}-${item.id}`} className="hover:bg-surface-container-low transition-colors cursor-pointer">
                        <td className="px-6 py-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-primary tabular-nums">{item.time}</span>
                            <div>
                              <p className="text-sm font-bold leading-tight">{item.patient}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-2 text-sm font-medium leading-tight">{item.procedure}</td>
                        <td className="px-6 py-2 text-sm text-on-surface-variant leading-tight">{item.doctor}</td>
                        <td className="px-6 py-2">
                          <div className="max-w-[180px]">
                            <p 
                              className="text-xs font-semibold text-on-surface truncate cursor-help leading-tight" 
                              title={item.notesCliniques}
                            >
                              {item.notesCliniques}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-2">
                          {item.status === "Décision rendue" ? (
                            <div>
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedDashboardStatusId(
                                    expandedDashboardStatusId === item.realId ? null : item.realId
                                  )
                                }
                                className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full transition-colors ${item.statusClass}`}
                              >
                                {item.status}
                                <span className="material-symbols-outlined text-[12px]">
                                  {expandedDashboardStatusId === item.realId ? "expand_less" : "expand_more"}
                                </span>
                              </button>
                              {expandedDashboardStatusId === item.realId && (
                                <p className="mt-1 text-[10px] font-semibold text-on-surface-variant whitespace-nowrap">
                                  Anesthésie : <span className="text-primary">{item.typeAnesthesie || "Non renseignée"}</span>
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className={`text-[9px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full ${item.statusClass}`}>
                              {item.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-2 text-right">
                          <div className="flex justify-end">
                            <TreatButton 
                              patient={item.patient} 
                              id={item.id} 
                              rendezVousId={item.realId}
                              prescriptionId={item.prescriptionId}
                              patientId={item.patientRealId}
                              procedure={item.procedure}
                            />
                          </div>
                        </td>
                      </tr>
                    )))}
                </tbody>
              </table>
            </div>
          </div>
          </div>

          <div className="col-span-12 lg:col-span-12 lg:mt-4 space-y-5">
            <div className="flex items-center justify-between px-2">
              <div>
                <h4 className="font-headline text-xl font-bold">Salle d&#39;endoscopie</h4>
              </div>
              <button
                onClick={() => setShowAddRoom(true)}
                className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
                title="Ajouter une salle"
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>

            <div className="space-y-4">
              {validSalles.length === 0 ? (
                <div className="p-6 text-center bg-surface-container-low rounded-2xl">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">meeting_room</span>
                  <p className="text-sm font-medium text-on-surface-variant">Aucune salle configurée</p>
                  <p className="text-xs text-on-surface-variant mt-1">Cliquez sur + pour ajouter une salle</p>
                </div>
              ) : (
                validSalles.map((salle) => {
                  const statusInfo = getSalleStatus(salle);
                  return (
                    <div key={salle.id} className={`p-5 bg-white rounded-2xl shadow-sm border-l-4 ${statusInfo.borderClass} cursor-pointer`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-on-surface">{salle.nom}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${statusInfo.statusClass}`}>
                          {statusInfo.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-surface-variant">{statusInfo.icon}</span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-on-surface">{salle.numero}</p>
                          <p className="text-[10px] text-on-surface-variant">
                            Capacité: {salle.capacite} • {salle.equipement || "Aucun équipement spécifique"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'ajout de salle */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-on-surface">Ajouter une salle</h3>
                <button
                  onClick={() => setShowAddRoom(false)}
                  className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Nom de la salle *</label>
                  <input
                    type="text"
                    value={newSalleData.nom}
                    onChange={(e) => setNewSalleData({ ...newSalleData, nom: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium text-slate-800"
                    placeholder="ex: Salle Endoscopie 4"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Numéro *</label>
                    <input
                      type="text"
                      value={newSalleData.numero}
                      onChange={(e) => setNewSalleData({ ...newSalleData, numero: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium text-slate-800"
                      placeholder="ex: S04"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Capacité</label>
                    <input
                      type="text"
                      value={newSalleData.capacite}
                      onChange={(e) => setNewSalleData({ ...newSalleData, capacite: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium text-slate-800"
                      placeholder="ex: 2"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Équipement spécifique (Optionnel)</label>
                  <input
                    type="text"
                    value={newSalleData.equipement}
                    onChange={(e) => setNewSalleData({ ...newSalleData, equipement: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium text-slate-800"
                    placeholder="ex: Appareil RX Mobile"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddRoom(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveSalle}
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">save</span>
                  )}
                  Enregistrer la salle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success notification */}
      {isSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="text-sm font-medium">Salle ajoutée avec succès !</span>
        </div>
      )}
    </AppShell>
  );
}
