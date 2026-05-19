"use client";

import Image from "next/image";
import { AppShell } from "@/components/layout/AppShell";
import TreatButton from "@/components/navigation/TreatButton";
import { useState, useEffect } from "react";



export default function Home() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [salles, setSalles] = useState<any[]>([]);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
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

  const fetchAppointments = async () => {
    try {
      const resp = await fetch("http://127.0.0.1:3333/api/rendezvous");
      if (resp.ok) {
        const data = await resp.json();
        const mapped = data.map((rdv: any) => {
          const start = new Date(rdv.dateHeureDebut);
          const status = rdv.statut || "En attente";

          let statusClass = "bg-surface-container text-on-surface-variant";
          if (status === "En cours") statusClass = "bg-blue-100 text-blue-800";
          if (status === "Terminé") statusClass = "bg-emerald-100 text-success";
          if (status === "Priorité" || status === "Urgent") statusClass = "bg-[#EA580C] text-white font-bold animate-pulse";
          if (status === "Confirmé") statusClass = "bg-primary/10 text-primary font-bold";

          const isConfirmed = ["Confirmé", "Terminé", "En cours", "Priorité", "Urgent", "Prévu"].includes(status);

          return {
            time: start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            patient: rdv.patient?.nom ? `${rdv.patient.prenom} ${rdv.patient.nom}` : (rdv.patientName || "Patient Inconnu"),
            id: `#END-${rdv.id.toString().slice(-4).toUpperCase()}`,
            realId: rdv.id,
            prescriptionId: rdv.prescriptionId || rdv.prescription?.id,
            patientRealId: rdv.patient?.id || rdv.patientId,
            procedure: isConfirmed ? (rdv.prescription?.typeExamen || rdv.procedure || rdv.typeExamen || "Examen Endoscopique") : "En attente de confirmation",
            doctor: rdv.medecin ? `Dr. ${rdv.medecin.nom}` : "Dr. Antoine Moreau",
            status: status,
            statusClass: statusClass,
            notesCliniques: rdv.notesCliniques || rdv.notes || "Dossier en cours",
            date: start.toISOString().split('T')[0],
            rawStart: start,
            rawEnd: rdv.dateHeureFin ? new Date(rdv.dateHeureFin) : new Date(start.getTime() + 45 * 60000), // Default 45 mins if no end
            salleId: rdv.salleId || rdv.salle?.id || null,
            salleName: rdv.salle?.nom || rdv.salle || "",
            hasCPA: !!rdv.prescription?.dossierCPA && rdv.prescription.dossierCPA.statut === "Valide",
          };
        });
        setAppointments(mapped);
      }
    } catch (e) {
      console.error("Error fetching appointments", e);
    }
  };

  const filteredSchedule = appointments.filter(item => {
    const matchesNom = (item.patient || "").toLowerCase().includes((filters.nom || "").toLowerCase());
    const matchesProcedure = (item.procedure || "").toLowerCase().includes((filters.procedure || "").toLowerCase());
    const matchesMedecin = (item.doctor || "").toLowerCase().includes((filters.medecin || "").toLowerCase());
    const matchesDate = !filters.date || item.date === filters.date;
    return matchesNom && matchesProcedure && matchesMedecin && matchesDate;
  });

  const fetchSalles = async (showLoading = true) => {
    if (showLoading) setIsRefreshing(true);
    try {
      const resp = await fetch("http://127.0.0.1:3333/api/salles");
      if (resp.ok) {
        const data = await resp.json();
        setSalles(Array.isArray(data) ? data : []);
        setLastUpdated(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }
    } catch (e) {
      console.error("Error fetching salles", e);
    } finally {
      if (showLoading) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSalles(true);
    fetchAppointments();
    const intervalId = setInterval(() => {
      fetchSalles(false);
      fetchAppointments();
    }, 15000);
    return () => clearInterval(intervalId);
  }, []);

  const handleSaveSalle = async () => {
    console.log("handleSaveSalle: newSalleData", newSalleData);
    if (!newSalleData.nom || !newSalleData.numero) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("http://127.0.0.1:3333/api/salles", {
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
        const refreshResp = await fetch("http://127.0.0.1:3333/api/salles");
        console.log("handleSaveSalle: refresh status", refreshResp.status);
        if (refreshResp.ok) {
          const refreshData = await refreshResp.json();
          console.log("handleSaveSalle: refresh data", JSON.stringify(refreshData, null, 2));
          setSalles(Array.isArray(refreshData) ? refreshData : []);
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
      <div className="pt-4 px-4 lg:px-8 max-w-7xl mx-auto space-y-8 pb-32">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 text-primary mb-3">
              <span className="material-symbols-outlined text-lg">waving_hand</span>
              <span className="text-lg font-semibold tracking-tight">Bonjour, Dr. Claire Durand</span>
            </div>
            <p className="text-on-surface-variant font-medium">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())} • Unite d&#39;Endoscopie CHU ANDRAINJATO
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <button
              onClick={() => fetchSalles(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/10 bg-white px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRefreshing ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-base">sync</span>
              )}
              Actualiser
            </button>
            <p className="text-[10px] text-on-surface-variant">
              Dernière mise à jour : {lastUpdated || "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-6 bg-white p-6 rounded-xl border-none shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">clinical_notes</span>
              </div>
            </div>
            <div>
              <p className="text-on-surface-variant text-sm font-semibold mb-1">Total Procedures Aujourd&#39;hui</p>
              <h3 className="text-4xl font-extrabold text-on-surface">{filteredSchedule.length.toString().padStart(2, '0')}</h3>
            </div>
            <div className="mt-6 flex items-center gap-2 text-emerald-600 text-xs font-bold">
              <span className="material-symbols-outlined text-sm">trending_up</span>
            </div>
          </div>

          <div className="col-span-12 md:col-span-6 text-on-primary p-6 rounded-xl border-none shadow-xl flex flex-col justify-between bg-[#EA580C] hover:bg-[#C2410C] transition-all active:scale-[0.98] cursor-pointer shadow-orange-500/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-orange-50 text-sm font-semibold mb-1">Urgents Actifs</p>
                <h3 className="text-4xl font-extrabold text-white">
                  {filteredSchedule.filter(a => a.status === 'Urgent' || a.status === 'Priorité').length.toString().padStart(2, '0')}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined">emergency</span>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex -space-x-2">
                <Image
                  src="/assets/avatars/doctor-1.svg"
                  alt="Doctor 1"
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full border-2 object-cover border-[#EA580C]"
                />
                <Image
                  src="/assets/avatars/doctor-2.svg"
                  alt="Doctor 2"
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full border-2 object-cover border-[#EA580C]"
                />
              </div>
              <p className="text-xs font-medium">Equipe d&#39;intervention depechee</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
              <h4 className="font-headline text-xl font-bold">Planning du Jour</h4>
              <div className="flex gap-4 items-center relative">
                <button
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
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-outline-variant/10 p-6 z-30 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
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

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant font-headline">
                          Procédure
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">medical_services</span>
                          <input
                            className="w-full bg-white border-2 border-primary rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold transition-all hover:ring-4 hover:ring-primary/10 focus:ring-4 focus:ring-primary/20 text-on-surface placeholder:text-slate-400 shadow-md outline-none"
                            type="text"
                            placeholder="Gastroscopie, Coloscopie..."
                            value={filters.procedure}
                            onChange={(e) => setFilters({ ...filters, procedure: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant font-headline">
                          Médecin
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">stethoscope</span>
                          <input
                            className="w-full bg-white border-2 border-primary rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold transition-all hover:ring-4 hover:ring-primary/10 focus:ring-4 focus:ring-primary/20 text-on-surface placeholder:text-slate-400 shadow-md outline-none"
                            type="text"
                            placeholder="Dr. Durand, Dr. Morel..."
                            value={filters.medecin}
                            onChange={(e) => setFilters({ ...filters, medecin: e.target.value })}
                          />
                        </div>
                      </div>

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

            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
              <div className="max-h-[600px] overflow-y-auto relative scrollbar-thin scrollbar-thumb-outline-variant/30 scrollbar-track-transparent">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-surface-container-low/95 backdrop-blur-sm shadow-sm">
                  <tr className="bg-surface-container-low/50">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      HEURE & PATIENT
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      PROCEDURE
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      MEDECIN
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      MOTIF
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      STATUT
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant text-right">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filteredSchedule.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
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
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-primary tabular-nums">{item.time}</span>
                            <div>
                              <p className="text-sm font-bold">{item.patient}</p>
                              <p className="text-[10px] text-on-surface-variant">ID: {item.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm font-medium">{item.procedure}</td>
                        <td className="px-6 py-5 text-sm text-on-surface-variant">{item.doctor}</td>
                        <td className="px-6 py-5">
                          <div className="max-w-[180px]">
                            <p 
                              className="text-xs font-semibold text-on-surface truncate cursor-help" 
                              title={item.notesCliniques}
                            >
                              {item.notesCliniques}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`text-[9px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full ${item.statusClass}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
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

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between px-2">
              <div>
                <h4 className="font-headline text-xl font-bold">Salle d&#39;endoscopie</h4>
                <p className="text-xs text-on-surface-variant">Statut en temps reel des salles d&#39;examen</p>
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
                <div className="p-8 text-center bg-surface-container-low rounded-2xl">
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

      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 z-50 group">
        <span className="material-symbols-outlined">add</span>
        <span className="absolute right-full mr-4 bg-on-surface text-white px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Nouvelle Admission
        </span>
      </button>

      {/* Modal d'ajout de salle */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
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

              <div className="flex items-center justify-end gap-3 mt-8">
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
