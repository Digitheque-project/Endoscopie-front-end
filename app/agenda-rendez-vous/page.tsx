"use client";

import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { apiJson } from "@/lib/api";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { JCalendar } from "@/components/ui/JCalendar";
import { useRendezVousSync } from "@/lib/hooks/useRendezVousSync";
import { useAuth } from "@/contexts/AuthContext";
import TreatButton from "@/components/navigation/TreatButton";
import SelectFilter from "@/components/ui/SelectFilter";
import ComboboxFilter from "@/components/ui/ComboboxFilter";

interface Appointment {
  id: string; // rendezVousId
  prescriptionId?: string;
  patientId?: string;
  medecinId?: string;
  salleId?: string;
  patient: string;
  medecin: string;
  salle: string;
  typeExamen: string;
  typeAnesthesie?: string | null;
  heureDebut: string; // "08:00"
  heureFin: string; // "08:45"
  statut: string; // "Terminé", "En cours", "Prévu", "Confirmé"
  color: string;
  date: string;  // "YYYY-MM-DD"
}

const EXCLUDED_RDV_STATUTS = new Set(["Annulé", "Terminé"]);

export default function AgendaPage() {
  const router = useRouter();
  const { role } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [doctorNames, setDoctorNames] = useState<string[]>([]);
  const [examTypes, setExamTypes] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState({ nom: "", procedure: "", medecin: "" });

  useEffect(() => {
    Promise.all([
      apiJson<any[]>('/api/medecins').catch(() => []),
      apiJson<{ id: string; name: string }[]>('/api/exam-types').catch(() => []),
    ]).then(([docs, types]) => {
      setDoctorNames((Array.isArray(docs) ? docs : []).map((d: any) => `Dr. ${d.prenom} ${d.nom}`.trim()));
      setExamTypes(Array.isArray(types) ? types : []);
    });
  }, []);

  const getCurrentDateISO = useCallback(() => {
    return currentDate.toISOString().split('T')[0];
  }, [currentDate]);

  const {
    rendezVous: syncedRendezVous,
    loading: syncLoading,
    error: syncError,
    lastRefresh: syncLastRefresh,
    refresh: refreshRDV
  } = useRendezVousSync({
    date: getCurrentDateISO(),
    refreshInterval: 30000,
    onRendezVousCreated: (rdv) => {
      setSuccessNotification(`Nouveau rendez-vous créé pour ${rdv.patient?.prenom || 'Patient'} ${rdv.patient?.nom || ''}`);
      setTimeout(() => setSuccessNotification(null), 3000);
    },
    onError: (error) => {
      console.error("Erreur de synchronisation:", error);
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const formattedDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).replace(/^\w/, (c) => c.toUpperCase());
  };

  useEffect(() => {
    const convertedApps: Appointment[] = syncedRendezVous.map((rdv: any) => {
      const start = new Date(rdv.dateHeureDebut);
      const end = rdv.dateHeureFin ? new Date(rdv.dateHeureFin) : new Date(start.getTime() + 45 * 60000);
      return {
        id: rdv.id,
        prescriptionId: rdv.prescriptionId || rdv.prescription?.id,
        patientId: rdv.patient?.id,
        medecinId: rdv.medecinId,
        salleId: rdv.salleId,
        patient: rdv.patient?.nom ? `${rdv.patient.prenom} ${rdv.patient.nom}` : (rdv.patientName || "Patient Inconnu"),
        medecin: rdv.medecin ? `Dr. ${rdv.medecin.prenom || ""} ${rdv.medecin.nom}`.trim() : "Médecin non assigné",
        salle: rdv.salle?.nom || "Salle non assignée",
        typeExamen: rdv.prescription?.typeExamen || rdv.typeExamen || "Examen Endoscopique",
        typeAnesthesie: rdv.typeAnesthesie || null,
        heureDebut: start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        heureFin: end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        statut: rdv.statut || "Confirmé",
        color: rdv.statut === 'Urgent' ? 'error' : 'primary',
        date: start.toISOString().split('T')[0]
      };
    });

    const filtered = convertedApps.filter(a => {
      const s = a.statut?.toString().toUpperCase() || "";
      if (s.includes("TERMINE") || s.includes("DONE")) return false;

      if (!a.date) return true;
      const selectedDateStr = currentDate.toISOString().split('T')[0];

      if (viewMode === "day") {
        return a.date === selectedDateStr;
      } else if (viewMode === "week") {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const appDate = new Date(a.date);
        return appDate >= startOfWeek && appDate <= endOfWeek;
      } else if (viewMode === "month") {
        const appDate = new Date(a.date);
        return appDate.getMonth() === currentDate.getMonth() && appDate.getFullYear() === currentDate.getFullYear();
      }

      return true;
    });

    setAppointments(filtered);
    setLastRefresh(syncLastRefresh);
  }, [syncedRendezVous, currentDate, viewMode, syncLastRefresh]);

  const visibleAppointments = appointments.filter((a) => {
    const matchesNom = a.patient.toLowerCase().includes(filters.nom.toLowerCase());
    const matchesProc = a.typeExamen.toLowerCase().includes(filters.procedure.toLowerCase());
    const matchesMed = a.medecin.toLowerCase().includes(filters.medecin.toLowerCase());
    return matchesNom && matchesProc && matchesMed;
  });

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") newDate.setDate(newDate.getDate() - 1);
    else if (viewMode === "week") newDate.setDate(newDate.getDate() - 7);
    else if (viewMode === "month") newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") newDate.setDate(newDate.getDate() + 1);
    else if (viewMode === "week") newDate.setDate(newDate.getDate() + 7);
    else if (viewMode === "month") newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleReplanifier = (app: Appointment) => {
    const params = new URLSearchParams();
    if (app.prescriptionId) params.set("prescriptionId", app.prescriptionId);
    if (app.patientId) params.set("patientId", app.patientId);
    if (app.patient) params.set("patientName", app.patient);
    if (app.typeExamen) params.set("procedure", app.typeExamen);
    if (app.medecinId) params.set("medecinId", app.medecinId);
    params.set("from", "agenda");
    router.push(`/planification-examens?${params.toString()}`);
  };

  const isReady = (app: Appointment) =>
    !!app.typeAnesthesie && !EXCLUDED_RDV_STATUTS.has(app.statut);

  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        <PageToolbar
          actions={
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl shadow-inner border border-outline-variant/10">
              <button
                onClick={handlePrevious}
                className="p-2 rounded-lg text-on-surface-variant hover:bg-white hover:text-primary transition-all active:scale-95"
                title="Précédent"
              >
                <span className="material-symbols-outlined text-xl">chevron_left</span>
              </button>

              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-primary hover:bg-white transition-all active:scale-95"
              >
                Aujourd'hui
              </button>

              <button
                onClick={handleNext}
                className="p-2 rounded-lg text-on-surface-variant hover:bg-white hover:text-primary transition-all active:scale-95"
                title="Suivant"
              >
                <span className="material-symbols-outlined text-xl">chevron_right</span>
              </button>
            </div>

            <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-xl shadow-inner border border-outline-variant/10">
              <button
                onClick={() => setViewMode("day")}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  viewMode === 'day'
                  ? "bg-white shadow-md text-primary"
                  : "text-on-surface-variant hover:bg-white/50"
                }`}
              >
                Journée
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  viewMode === 'week'
                  ? "bg-white shadow-md text-primary"
                  : "text-on-surface-variant hover:bg-white/50"
                }`}
              >
                Semaine
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  viewMode === 'month'
                  ? "bg-white shadow-md text-primary"
                  : "text-on-surface-variant hover:bg-white/50"
                }`}
              >
                Mois
              </button>
            </div>

            <button
              onClick={() => refreshRDV()}
              disabled={syncLoading}
              className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Actualiser"
            >
              <span className={`material-symbols-outlined text-xl ${syncLoading ? 'animate-spin' : ''}`}>refresh</span>
            </button>
          </div>
          }
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-sm">calendar_today</span>
            <div className="flex flex-col">
              <p className="text-on-surface-variant font-bold">
                {mounted ? (viewMode === 'day' ? formattedDate(currentDate) :
                 viewMode === 'week' ? `Semaine du ${new Date(currentDate.getTime() - currentDate.getDay() * 86400000).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long'})} au ${new Date(currentDate.getTime() + (6 - currentDate.getDay()) * 86400000).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'})}` :
                 currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase()) : 'Chargement...'}
              </p>
              <span className="text-[10px] text-on-surface-variant/60 font-medium italic">Actualisé à {mounted ? lastRefresh.toLocaleTimeString('fr-FR') : '--:--:--'}</span>
            </div>
          </div>
        </PageToolbar>

        <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4">
          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Nom du Patient
            </label>
            <input
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-primary/20 text-on-surface"
              type="text"
              placeholder="Rechercher un patient..."
              value={filters.nom}
              onChange={(e) => setFilters({ ...filters, nom: e.target.value })}
            />
          </div>
          <div className="min-w-[200px]">
            <SelectFilter
              label="Procédure"
              value={filters.procedure}
              onChange={(v) => setFilters({ ...filters, procedure: v })}
              options={examTypes.map((t) => ({ value: t.name, label: t.name }))}
            />
          </div>
          <div className="min-w-[220px]">
            <ComboboxFilter
              label="Médecin"
              value={filters.medecin}
              onChange={(v) => setFilters({ ...filters, medecin: v })}
              options={doctorNames}
              placeholder="Rechercher un médecin..."
            />
          </div>
        </div>

        {successNotification && (
          <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top duration-300">
            <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 font-semibold">
              <span className="material-symbols-outlined">check_circle</span>
              {successNotification}
            </div>
          </div>
        )}

        {syncLoading && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Chargement des rendez-vous...
          </div>
        )}

        {syncError && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            Erreur lors du chargement: {syncError.message}
          </div>
        )}

        <div className="min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
          {!syncLoading && visibleAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[600px] text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl opacity-20 mb-4">event</span>
              <p className="text-lg font-semibold">Aucun rendez-vous pour {formattedDate(currentDate)}</p>
              <p className="text-sm mt-2">Les rendez-vous confirmés apparaîtront ici</p>
            </div>
          ) : (
            <JCalendar
              appointments={visibleAppointments}
              viewMode={viewMode}
              currentDate={currentDate}
              onAppointmentClick={(app) => {
                const full = visibleAppointments.find((a) => a.id === app.id) || null;
                setSelected(full);
              }}
            />
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-outline-variant/20" onClick={(e) => e.stopPropagation()}>
              <header className="bg-primary p-5 text-white flex justify-between items-center">
                <h2 className="text-lg font-headline font-bold">{selected.patient}</h2>
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </header>
              <div className="p-5 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-on-surface-variant">Procédure</span><span className="font-semibold">{selected.typeExamen}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Médecin</span><span className="font-semibold">{selected.medecin}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Salle</span><span className="font-semibold">{selected.salle}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Horaire</span><span className="font-semibold">{selected.heureDebut} – {selected.heureFin}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Statut</span><span className="font-semibold">{selected.statut}{selected.typeAnesthesie ? ` — ${selected.typeAnesthesie}` : ""}</span></div>
              </div>
              <footer className="flex flex-wrap justify-end gap-2 p-5 pt-0">
                {role === "MAJOR" && selected.prescriptionId && (
                  <button
                    onClick={() => handleReplanifier(selected)}
                    className="px-4 py-2 rounded-lg border border-outline-variant/30 text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-colors"
                  >
                    Replanifier
                  </button>
                )}
                {selected.prescriptionId && (
                  <button
                    onClick={() => router.push(`/patient-dossier/${encodeURIComponent(selected.prescriptionId!)}`)}
                    className="px-4 py-2 rounded-lg border border-outline-variant/30 text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-colors"
                  >
                    Détails
                  </button>
                )}
                {isReady(selected) && (
                  <TreatButton
                    patient={selected.patient}
                    id={selected.id}
                    rendezVousId={selected.id}
                    prescriptionId={selected.prescriptionId}
                    patientId={selected.patientId}
                    procedure={selected.typeExamen}
                  />
                )}
              </footer>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">query_stats</span>
              </div>
              <h3 className="font-headline font-bold text-on-surface text-sm">Taux d'occupation</h3>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-headline font-extrabold text-on-surface">
                {appointments.length > 0 ? "45%" : "0%"}
              </span>
            </div>
            <div className="w-full bg-surface-container-highest h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: appointments.length > 0 ? "45%" : "0%" }} />
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-success-container text-success flex items-center justify-center">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <h3 className="font-headline font-bold text-on-surface text-sm">Actes Terminés</h3>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-headline font-extrabold text-on-surface">
                {appointments.filter(a => a.statut === 'Terminé').length}
              </span>
              <span className="text-on-surface-variant text-xs font-medium">sur {appointments.length} prévus</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-tertiary-fixed text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined">groups</span>
              </div>
              <h3 className="font-headline font-bold text-on-surface text-sm">Rendez-vous affichés</h3>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-headline font-extrabold text-on-surface">{visibleAppointments.length}</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
