"use client";

import Image from "next/image";
import { AppShell } from "@/components/layout/AppShell";
import { useEffect, useState } from "react";
import { JCalendar } from "@/components/ui/JCalendar";

interface Appointment {
  id: string;
  patient: string;
  medecin: string;
  salle: string;
  typeExamen: string;
  heureDebut: string; // "08:00"
  heureFin: string; // "08:45"
  statut: string; // "Terminé", "En cours", "Prévu", "Confirmé"
  color: string; // "emerald", "primary", "outline", "tertiary"
  date: string;  // "YYYY-MM-DD"
}

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  
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
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState({
    patient: "",
    procedure: "Coloscopie",
    medecin: "Dr. Leclerc",
    salle: "Salle 1",
    date: "2024-05-24",
    heureDebut: "14:00",
    heureFin: "15:00",
    notes: "",
    statut: "Confirmé"
  });

  const checkConflict = (newApp: any) => {
    return appointments.some(app => {
      // Basic room and time overlap check
      if (app.salle === newApp.salle) {
        const start1 = app.heureDebut;
        const end1 = app.heureFin;
        const start2 = newApp.heureDebut;
        const end2 = newApp.heureFin;
        return (start2 < end1 && end2 > start1);
      }
      return false;
    });
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (checkConflict(bookingData)) {
      setBookingError("Conflit d'horaire : Cette salle est déjà réservée pour ce créneau.");
      return;
    }

    const newAppointment: Appointment = {
      id: Date.now().toString(),
      patient: bookingData.patient,
      medecin: bookingData.medecin,
      salle: bookingData.salle,
      typeExamen: bookingData.procedure,
      heureDebut: bookingData.heureDebut,
      heureFin: bookingData.heureFin,
      statut: bookingData.statut,
      color: "primary"
    };

    setAppointments([...appointments, newAppointment]);
    setShowBookingModal(false);
    setBookingData({ ...bookingData, patient: "", notes: "" });
  };

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

  useEffect(() => {
    const loadAppointments = async () => {
      // 1. Fetch from API
      let apiApps: Appointment[] = [];
      try {
        const resp = await fetch("http://127.0.0.1:3333/api/rendezvous");
        const data = await resp.json();
        apiApps = data.map((rdv: any) => {
          const start = new Date(rdv.dateHeureDebut);
          const end = rdv.dateHeureFin ? new Date(rdv.dateHeureFin) : new Date(start.getTime() + 45 * 60000);
          return {
            id: rdv.id,
            patient: rdv.patient?.nom ? `${rdv.patient.prenom} ${rdv.patient.nom}` : (rdv.patientName || "Patient Inconnu"),
            medecin: rdv.medecin ? `Dr. ${rdv.medecin.nom}` : "Dr. Antoine Moreau",
            salle: rdv.salle?.nom || "Salle 1",
            typeExamen: rdv.procedure || rdv.typeExamen || "Examen Endoscopique",
            heureDebut: start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            heureFin: end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            statut: rdv.statut || "Confirmé",
            color: "primary",
            date: start.toISOString().split('T')[0]
          };
        });
      } catch (e) {
        console.error("Error fetching API appointments", e);
      }

      // Combine and filter duplicates by patient/time
      const combined = [...apiApps];
      
      // Filter by active date (Day, Week, Month)
      const filtered = combined.filter(a => {
        // Status filter: Hide "Terminé"
        const s = a.statut?.toString().toUpperCase() || "";
        if (s.includes("TERMINE") || s.includes("DONE")) return false;

        // Date filter
        if (!a.date) return true; // Keep legacy/manual if no date
        
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
      setLastRefresh(new Date());
    };

    loadAppointments();

    // Polling every 30 seconds for real-time updates
    const interval = setInterval(loadAppointments, 30000);
    return () => clearInterval(interval);
  }, [currentDate, viewMode]);

  return (
    <AppShell>
      <div className="p-8 max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface">Agenda / Rendez-vous</h1>
            <div className="flex items-center gap-3 mt-1">
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
          </div>
          <div className="flex items-center gap-4">
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
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  viewMode === 'day' 
                  ? "bg-white shadow-md text-primary scale-105" 
                  : "text-on-surface-variant hover:bg-white/50"
                }`}
              >
                Journée
              </button>
              <button 
                onClick={() => setViewMode("week")}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  viewMode === 'week' 
                  ? "bg-white shadow-md text-primary scale-105" 
                  : "text-on-surface-variant hover:bg-white/50"
                }`}
              >
                Semaine
              </button>
              <button 
                onClick={() => setViewMode("month")}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  viewMode === 'month' 
                  ? "bg-white shadow-md text-primary scale-105" 
                  : "text-on-surface-variant hover:bg-white/50"
                }`}
              >
                Mois
              </button>
            </div>
          </div>
        </header>

        {/* JCalendar Integration */}
        <div className="min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
          <JCalendar 
            appointments={appointments}
            viewMode={viewMode}
            currentDate={currentDate}
            onAppointmentClick={(app) => {
              console.log("Appointment clicked:", app);
            }}
            onSlotClick={(date, time) => {
              setBookingData({
                ...bookingData,
                date: date.toISOString().split('T')[0],
                heureDebut: time
              });
              setShowBookingModal(true);
            }}
          />
        </div>
        
        <div className="mt-8 p-6 bg-surface-container-low/50 rounded-2xl border-2 border-dashed border-outline-variant/20">
          <button 
            onClick={() => setShowBookingModal(true)}
            className="w-full py-4 flex flex-col items-center justify-center gap-2 text-on-surface-variant/40 hover:text-primary transition-all group"
          >
            <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">add_circle</span>
            <span className="text-xs font-black uppercase tracking-[0.2em]">Réserver un nouveau créneau d'endoscopie</span>
          </button>
        </div>

        {/* Booking Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-outline-variant/20 animate-in fade-in zoom-in duration-200">
              <header className="bg-primary p-6 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-headline font-bold">Réserver un créneau</h2>
                  <p className="text-xs text-white/70 uppercase tracking-widest mt-1">Nouvel examen endoscopique</p>
                </div>
                <button onClick={() => setShowBookingModal(false)} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </header>

              <form onSubmit={handleBookingSubmit} className="p-8 space-y-6">
                {bookingError && (
                  <div className="bg-error/10 border border-error/20 p-4 rounded-xl flex items-center gap-3 text-error text-sm font-bold animate-shake">
                    <span className="material-symbols-outlined">warning</span>
                    {bookingError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Patient</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Nom complet du patient"
                      className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-4 py-3 rounded-t-lg text-sm font-bold text-on-surface outline-none transition-all"
                      value={bookingData.patient}
                      onChange={e => setBookingData({...bookingData, patient: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Procédure</label>
                    <select 
                      className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-4 py-3 rounded-t-lg text-sm font-bold text-on-surface outline-none"
                      value={bookingData.procedure}
                      onChange={e => setBookingData({...bookingData, procedure: e.target.value})}
                    >
                      <option>Coloscopie</option>
                      <option>Gastroscopie</option>
                      <option>CPRE</option>
                      <option>Echo-endoscopie</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Médecin</label>
                    <select 
                      className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-4 py-3 rounded-t-lg text-sm font-bold text-on-surface outline-none"
                      value={bookingData.medecin}
                      onChange={e => setBookingData({...bookingData, medecin: e.target.value})}
                    >
                      <option>Dr. Leclerc</option>
                      <option>Dr. Morel</option>
                      <option>Dr. Girard</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Salle</label>
                    <select 
                      className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-4 py-3 rounded-t-lg text-sm font-bold text-on-surface outline-none"
                      value={bookingData.salle}
                      onChange={e => setBookingData({...bookingData, salle: e.target.value})}
                    >
                      <option>Salle 1</option>
                      <option>Salle 2</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-4 py-3 rounded-t-lg text-sm font-bold text-on-surface outline-none"
                      value={bookingData.date}
                      onChange={e => setBookingData({...bookingData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Début</label>
                    <input 
                      type="time" 
                      className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-4 py-3 rounded-t-lg text-sm font-bold text-on-surface outline-none"
                      value={bookingData.heureDebut}
                      onChange={e => setBookingData({...bookingData, heureDebut: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Fin</label>
                    <input 
                      type="time" 
                      className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-4 py-3 rounded-t-lg text-sm font-bold text-on-surface outline-none"
                      value={bookingData.heureFin}
                      onChange={e => setBookingData({...bookingData, heureFin: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Notes / Commentaires</label>
                  <textarea 
                    placeholder="Précisions cliniques..."
                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-4 py-3 rounded-t-lg text-sm font-bold text-on-surface outline-none h-24 resize-none"
                    value={bookingData.notes}
                    onChange={e => setBookingData({...bookingData, notes: e.target.value})}
                  />
                </div>

                <footer className="flex justify-end gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="px-6 py-3 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Confirmer la réservation
                  </button>
                </footer>
              </form>
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">query_stats</span>
              </div>
              <h3 className="font-headline font-bold text-on-surface">Taux d'occupation</h3>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-headline font-extrabold text-on-surface">
                {appointments.length > 0 ? "45%" : "0%"}
              </span>
              <span className="text-sm font-semibold text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">trending_flat</span> 0%
              </span>
            </div>
            <div className="w-full bg-surface-container-highest h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: appointments.length > 0 ? "45%" : "0%" }} />
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-success-container text-success flex items-center justify-center">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <h3 className="font-headline font-bold text-on-surface">Actes Terminés</h3>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-headline font-extrabold text-on-surface">
                {appointments.filter(a => a.statut === 'Terminé').length}
              </span>
              <span className="text-on-surface-variant text-sm font-medium">sur {appointments.length} prévus</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-4 font-medium italic">Mise à jour en temps réel</p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-tertiary-fixed text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <h3 className="font-headline font-bold text-on-surface">Alertes Labo</h3>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-headline font-extrabold text-on-surface">03</span>
              <button className="text-primary text-xs font-bold uppercase tracking-tighter hover:underline">Voir tout</button>
            </div>
            <div className="flex -space-x-2 mt-4">
              <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-container-highest flex items-center justify-center text-[10px] font-bold">
                JB
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-container-highest flex items-center justify-center text-[10px] font-bold">
                TM
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                +1
              </div>
            </div>
          </div>
        </div>
      </div>

      <a
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-primary to-primary-container text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-50 group"
        href="/prescriptions"
      >
        <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
      </a>
    </AppShell>
  );
}
