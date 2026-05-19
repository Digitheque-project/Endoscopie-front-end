"use client";

import { AppShell } from "@/components/layout/AppShell";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import StatBadge from "@/components/ui/StatBadge";

function PlanificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const patientId = searchParams.get("patientId") || "#PX-8829-01";
  const patientName = searchParams.get("patientName") || "MARIE LEFEBVRE";
  const procedureParam = searchParams.get("procedure") || "Fibroscopie Oeso-Gastro-Duodénale";
  const reasonParam = searchParams.get("reason") || "Hémorragie digestive haute - Suspicion d'ulcère gastrique.";
  const prescriptionId = searchParams.get("prescriptionId") || null;
  const medecinId = searchParams.get("medecinId") || null;

  const [medecinInfo, setMedecinInfo] = useState<any | null>(null);
  const [isMedecinLoading, setIsMedecinLoading] = useState(false);
  const [medecinError, setMedecinError] = useState<string | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<any | null>(null);
  const [isPrescriptionLoading, setIsPrescriptionLoading] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form states
  const [selectedSurgeon, setSelectedSurgeon] = useState("Dr. Elena Rodriguez");
  const getTodayLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [date, setDate] = useState(getTodayLocal());
  const [heureDebut, setHeureDebut] = useState("09:00");
  const [heureFin, setHeureFin] = useState("10:00");
  const [dateError, setDateError] = useState<string | null>(null);

  const buildDateTime = (date: string, time: string) => new Date(`${date}T${time}`);

  // Validation de la date et des heures
  useEffect(() => {
    const start = buildDateTime(date, heureDebut);
    const end = buildDateTime(date, heureFin);

    if (end <= start) {
      setDateError("L'heure de fin doit être postérieure à l'heure de début.");
    } else {
      setDateError(null);
    }
  }, [date, heureDebut, heureFin]);

  const formattedCurrentDate = useMemo(() => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).replace(/^\w/, (c) => c.toUpperCase());
  }, [date]);
  const [observations, setObservations] = useState("");
  const [salles, setSalles] = useState<any[]>([]);
  const [newSalleData, setNewSalleData] = useState({
    nom: "",
    numero: "",
    capacite: "1",
    equipement: ""
  });

  const handleOpenCPA = () => {
    router.push(`/demande-cpa?patientId=${encodeURIComponent(patientId)}`);
  };

  const handleLocalAnesthesia = () => {
    router.push(`/planification-examens?patientId=${encodeURIComponent(patientId)}`);
  };

  useEffect(() => {
    const loadMedecin = async () => {
      try {
        setIsMedecinLoading(true);
        const response = await fetch("http://127.0.0.1:3333/api/medecins");
        const medecins = await response.json();
        if (medecinId) {
          const found = medecins.find((medecin: any) => medecin.id === medecinId);
          setMedecinInfo(found || null);
        }
      } catch (error) {
        console.error("Erreur de chargement des médecins:", error);
        setMedecinError("Erreur API");
      } finally {
        setIsMedecinLoading(false);
      }
    };

    loadMedecin();

    const fetchPrescriptionDetails = async () => {
      if (!prescriptionId) return;
      try {
        setIsPrescriptionLoading(true);
        const resp = await fetch(`http://127.0.0.1:3333/api/prescriptions/${prescriptionId}`);
        if (resp.ok) {
          const data = await resp.json();
          setPrescriptionData(data);
        }
      } catch (e) {
        console.error("Error fetching prescription details", e);
      } finally {
        setIsPrescriptionLoading(false);
      }
    };
    fetchPrescriptionDetails();

    const fetchSalles = async () => {
      try {
        const resp = await fetch("http://127.0.0.1:3333/api/salles");
        const data = await resp.json();
        setSalles(data);
      } catch (e) {
        console.error("Error fetching salles", e);
      }
    };
    fetchSalles();
  }, [medecinId, prescriptionId]);

  const priorityIndicator = useMemo(() => {
    const rawPriority = (prescriptionData?.priorite || searchParams.get("priority") || "NORMAL").toUpperCase();
    
    // Logic similar to prescriptions/page.tsx
    if (rawPriority === "STAT" || rawPriority === "URGENCE VITALE") {
      return {
        label: rawPriority === "STAT" ? "STAT" : "Urgent Vital",
        icon: "warning",
        className: "bg-red-600 text-white animate-pulse font-bold px-3 py-1 rounded-full shadow-md",
      };
    }
    if (rawPriority === "URGENT" || rawPriority === "URGENCE") {
      return { 
        label: "Urgent", 
        icon: "priority_high", 
        className: "bg-[#EA580C] hover:bg-[#C2410C] transition-all text-white font-bold shadow-sm px-3 py-1 rounded-full" 
      };
    }
    if (rawPriority === "PRIORITAIRE") {
      return { 
        label: "Prioritaire", 
        icon: "warning", 
        className: "bg-amber-400 text-black font-bold px-3 py-1 rounded-full" 
      };
    }
    return { 
      label: "Normale", 
      icon: "check_circle", 
      className: "bg-surface-container text-on-surface-variant px-3 py-1 rounded-full" 
    };
  }, [prescriptionData]);

  const prescriberLabel = useMemo(() => {
    if (medecinInfo) {
      return `Dr. ${medecinInfo.prenom} ${medecinInfo.nom}`;
    }

    return searchParams.get("prescriber") || "Dr. Antoine Moreau";
  }, [medecinInfo, searchParams]);

  const [selectedSalle, setSelectedSalle] = useState("Salle 1");

  const checkConflicts = async (newStart: Date, newEnd: Date, salle: string) => {
    try {
      const resp = await fetch("http://127.0.0.1:3333/api/rendezvous");
      if (!resp.ok) return false;
      const appointments = await resp.json();
      
      return appointments.some((app: any) => {
        if (app.salle === salle || (app.salle && app.salle.nom === salle)) {
          const appStart = new Date(app.dateHeureDebut);
          const appEnd = new Date(app.dateHeureFin);
          return (newStart < appEnd && newEnd > appStart);
        }
        return false;
      });
    } catch (e) {
      console.error("Error checking conflicts", e);
      return false;
    }
  };

  const handleConfirmRDV = async () => {
    setIsSubmitting(true);
    
    try {
      const dateTimeDebut = buildDateTime(date, heureDebut);
      const dateTimeFin = buildDateTime(date, heureFin);

      if (dateTimeFin <= dateTimeDebut) {
        alert("Erreur: L'heure de fin doit être après l'heure de début.");
        setIsSubmitting(false);
        return;
      }

      // Check for conflicts
      const hasConflict = await checkConflicts(dateTimeDebut, dateTimeFin, selectedSalle);
      if (hasConflict) {
        alert(`Conflit d'horaire : La ${selectedSalle} est déjà occupée sur ce créneau.`);
        setIsSubmitting(false);
        return;
      }

      // Construction de l'objet rendez-vous avec les informations du formulaire
      const selectedSalleObj = salles.find(s => s.nom === selectedSalle);
      
      // Function to create a "naive" ISO string (no timezone/offset)
      // This ensures the database stores the EXACT hours/minutes selected
      const toNaiveISO = (d: Date) => {
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      };

      const appointmentData = {
        patientId: patientId.startsWith("#") ? null : patientId,
        patientName: patientName,
        prescriptionId: prescriptionId || null,
        medecinId: medecinId || null,
        medecinName: selectedSurgeon,
        procedure: procedureParam,
        typeExamen: procedureParam,
        salleId: selectedSalleObj?.id || null,
        salle: selectedSalle,
        dateHeureDebut: toNaiveISO(dateTimeDebut),
        dateHeureFin: toNaiveISO(dateTimeFin),
        typeAnesthesie: pathname === '/planification-examens' ? 'Locale' : 'Générale',
        statut: priorityIndicator.label === 'Urgent' || priorityIndicator.label === 'STAT' ? 'Urgent' : 'Confirmé',
        notesCliniques: observations || null
      };

      // 1. Sauvegarde en Base de données via API
      const response = await fetch("http://127.0.0.1:3333/api/rendezvous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur lors de la sauvegarde: ${response.status} - ${text}`);
      }

      // 2. Sauvegarde en LocalStorage pour synchronisation immédiate de l'interface (compatibilité héritée)
      const appointmentForLocal = {
        id: Date.now().toString(),
        patient: patientName,
        date: dateTimeDebut.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
        heure: `${dateTimeDebut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${dateTimeFin.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
        anesthesie: appointmentData.typeAnesthesie,
        status: "Confirmé",
        medecin: selectedSurgeon,
        procedure: procedureParam,
        salle: selectedSalle,
        notesCliniques: observations || null
      };

      const existing = JSON.parse(localStorage.getItem('appointments') || '[]');
      localStorage.setItem('appointments', JSON.stringify([...existing, appointmentForLocal]));

      setIsSuccess(true);
      setTimeout(() => {
        router.push(`/agenda-rendez-vous?patientId=${encodeURIComponent(patientId)}`);
      }, 1000);
    } catch (error) {
      console.error("Erreur lors de la synchronisation du rendez-vous:", error);
      alert("Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setDate("2024-05-24");
    setHeureDebut("09:00");
    setHeureFin("10:00");
    setObservations("");
    // Message de retour visuel optionnel
    alert("Planification annulée : les champs ont été réinitialisés.");
  };

  const selectedStartDate = buildDateTime(date, heureDebut);
  const selectedEndDate = buildDateTime(date, heureFin);


  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Back Button */}
      <a href="/prescriptions" className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/20 px-6 py-3 text-on-surface-variant hover:text-primary hover:border-primary transition-all">
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        <span className="font-semibold">Retour au fil de prescription</span>
      </a>

      {/* Patient Header */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white rounded-xl border border-outline-variant/30 p-6 flex gap-6 items-start shadow-sm">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-container flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-primary">person</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">{patientName}</h3>
                <p className="text-on-surface-variant font-medium flex items-center gap-2 text-sm mt-0.5">
                  <span className="text-primary font-bold">ID: {patientId}</span>
                  {prescriptionId ? <span className="text-on-surface-variant">• Prescription: {prescriptionId}</span> : null}
                </p>
              </div>
              <div className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${priorityIndicator.className}`}>
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {priorityIndicator.icon}
                </span>
                {priorityIndicator.label}
              </div>
            </div>
            <div className="mt-4 flex gap-12">
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Poids</p>
                <p className="text-sm font-bold">64.5 kg</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Dernier repas</p>
                <p className="text-sm font-bold text-error">À jeun (04:00 AM)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-secondary-fixed p-6 rounded-xl flex flex-col justify-between border border-outline-variant/10 shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-on-secondary-fixed-variant uppercase tracking-wider mb-1">MÉDECIN PRESCRIPTEUR</p>
            <p className="font-headline font-bold text-on-secondary-fixed text-lg">
              {isMedecinLoading ? "Chargement..." : medecinError ? "Service indisponible" : prescriberLabel}
            </p>
            <p className="text-xs text-on-secondary-fixed-variant font-medium">
              {medecinInfo?.specialite || "Service de Gastro-entérologie"}
            </p>
          </div>
            <div className="mt-4">
            <p className="text-[10px] font-bold text-on-secondary-fixed-variant uppercase tracking-wider mb-1">EXAMEN DEMANDÉ</p>
            <p className="text-sm font-bold text-on-secondary-fixed leading-tight">{procedureParam}</p>
          </div>
        </div>
      </section>

      {/* Anesthesia Choice */}
      <section className="rounded-3xl border-2 border-primary/20 bg-gradient-to-r from-primary/10 via-white to-tertiary/10 px-6 py-5 shadow-md shadow-primary/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-error/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-error">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  priority_high
                </span>
                Obligatoire
              </span>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Choix d'anesthésie</p>
            </div>
            <p className="text-base font-semibold text-on-surface leading-snug">Sélectionnez l'anesthésie avant de finaliser la planification du créneau.</p>
            <p className="text-sm text-on-surface-variant font-medium mt-2">Ce choix conditionne la suite du parcours et doit rester visible à tout moment.</p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-right">Sélection requise</p>
            <div className="flex items-center rounded-2xl border border-outline-variant/30 bg-surface-container p-1.5 shadow-inner">
              <button 
                onClick={handleLocalAnesthesia}
                className={`min-w-[11rem] px-6 py-3 text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer rounded-xl ${
                  pathname === '/planification-examens'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm border border-gray-200'
                }`}
              >
                Anesthésie locale
              </button>
              <button 
                onClick={handleOpenCPA}
                className={`min-w-[11rem] px-6 py-3 text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer rounded-xl ${
                  pathname === '/demande-cpa'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm border border-gray-200'
                }`}
              >
                Anesthésie générale
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Context */}
        <div className="lg:col-span-5 space-y-6">
          {/* Clinical Context */}
          <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/20 shadow-sm">
            <h4 className="font-headline font-bold text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">clinical_notes</span>
              Contexte Clinique
            </h4>
            <div className="space-y-5">
              <div className="bg-white p-4 rounded-lg border border-outline-variant/10">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">MOTIF DE L'EXAMEN</p>
                <p className="text-sm text-on-surface font-medium leading-relaxed">{reasonParam}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">HISTORIQUE MÉDICAL</p>
                <ul className="text-sm space-y-2 text-on-surface-variant font-medium">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                    Hypertension chronique
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                    Traitement anticoagulant (interrompu)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                    Anémie ferriprive
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.1em]">
                  Observations cliniques &amp; détails de l'intervention
                </label>
                <textarea
                  className="w-full min-h-[150px] bg-white rounded-lg p-4 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/40 resize-none leading-relaxed border border-outline-variant/20 focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Saisissez les antécédents, l'indication chirurgicale et les observations particulières..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                />
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/10">
                    <span className="material-symbols-outlined text-primary mb-2 block text-lg">person_search</span>
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Demandeur</p>
                    <p className="text-sm font-black text-on-surface">{isMedecinLoading ? "Chargement..." : prescriberLabel}</p>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{medecinInfo?.specialite || "Service de Gastro-entérologie"}</p>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/10">
                    <span className={`material-symbols-outlined mb-2 block text-lg font-bold ${priorityIndicator.label === 'Normale' ? 'text-primary' : priorityIndicator.label === 'STAT' || priorityIndicator.label === 'Urgent Vital' ? 'text-red-600' : 'text-[#EA580C]'}`}>
                      {priorityIndicator.icon}
                    </span>
                    <p className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${priorityIndicator.label === 'Normale' ? 'text-on-surface-variant' : priorityIndicator.label === 'STAT' || priorityIndicator.label === 'Urgent Vital' ? 'text-red-600' : 'text-[#EA580C]'}`}>
                      {priorityIndicator.label}
                    </p>
                    <p className="text-sm font-black text-on-surface">
                      {priorityIndicator.label === 'Normale' ? 'Standard (48h)' : priorityIndicator.label === 'Prioritaire' ? 'Prioritaire (24h)' : 'Priorité Immédiate'}
                    </p>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/10">
                    <span className="material-symbols-outlined text-primary mb-2 block text-lg">calendar_today</span>
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Date souhaitée</p>
                    <p className="text-sm font-black text-on-surface">12 Oct. 2023</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Planning Form */}
        <div className="lg:col-span-7">
          <div className="bg-white p-8 rounded-xl border border-outline-variant/30 shadow-md space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">Planification du créneau</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-primary text-sm">calendar_today</span>
                  <p className="text-sm font-bold text-primary">{formattedCurrentDate}</p>
                  <button 
                    onClick={() => setDate(new Date().toISOString().split('T')[0])}
                    className="ml-2 px-2 py-0.5 rounded-md bg-primary/10 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/20 transition-all"
                  >
                    Aujourd'hui
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant mt-1.5 font-medium">Étape 2 sur 3 : Sélection des ressources</p>
              </div>
              <span className="text-[10px] font-black bg-surface-container px-3 py-1 rounded-full uppercase tracking-widest text-on-surface-variant">PLANNING</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">CHIRURGIEN SÉLECTIONNÉ</label>
                <select 
                  value={selectedSurgeon}
                  onChange={(e) => setSelectedSurgeon(e.target.value)}
                  className="w-full appearance-none bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-4 py-3.5 rounded-t-lg text-sm font-bold text-on-surface transition-all focus:ring-0"
                >
                  <option>Dr. Elena Rodriguez</option>
                  <option>Dr. Marc Vernet</option>
                  <option>Dr. Sarah Jenkins</option>
                  {medecinInfo && <option value={medecinInfo.id}>Dr. {medecinInfo.prenom} {medecinInfo.nom}</option>}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">SALLE D'OPÉRATION</label>
                <select 
                  className="w-full appearance-none bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-4 py-3.5 rounded-t-lg text-sm font-bold text-on-surface transition-all focus:ring-0"
                  value={selectedSalle}
                  onChange={(e) => setSelectedSalle(e.target.value)}
                  id="room-selector"
                >
                  {salles.length > 0 ? (
                    salles.map((s: any) => (
                      <option key={s.id} value={s.nom}>{s.nom} ({s.numero})</option>
                    ))
                  ) : (
                    <>
                      <option value="Salle 1">Salle 1</option>
                      <option value="Salle 2">Salle 2</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-primary">calendar_month</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Date</p>
                      <p className="text-sm font-semibold text-on-surface">Sélectionnez la journée de l'examen</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Date</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full appearance-none bg-white border border-outline-variant/50 px-4 py-3 rounded-2xl text-sm font-bold text-on-surface transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-primary">schedule</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Heures</p>
                      <p className="text-sm font-semibold text-on-surface">Définissez l'heure de début et de fin de l'examen</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Heure de début</label>
                      <input
                        type="time"
                        value={heureDebut}
                        onChange={(e) => setHeureDebut(e.target.value)}
                        className="w-full appearance-none bg-white border border-outline-variant/50 px-4 py-3 rounded-2xl text-sm font-bold text-on-surface transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Heure de fin</label>
                      <input
                        type="time"
                        value={heureFin}
                        onChange={(e) => setHeureFin(e.target.value)}
                        className={`w-full appearance-none bg-white border ${dateError ? 'border-error' : 'border-outline-variant/50'} px-4 py-3 rounded-2xl text-sm font-bold text-on-surface transition-all focus:border-primary focus:ring-2 focus:ring-primary/10`}
                      />
                    </div>
                  </div>
                </div>

                {dateError && <p className="text-[10px] font-bold text-error px-1">{dateError}</p>}
              </div>
            </div>

            <div className="p-6 rounded-xl bg-surface border border-dashed border-outline-variant/40 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    event_available
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">RENDEZ-VOUS SÉLECTIONNÉ</p>
                  <p className="text-base font-extrabold text-on-surface">
                    {selectedStartDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} • {selectedStartDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} → {selectedEndDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-on-surface-variant font-medium">{pathname === '/planification-examens' ? 'Anesthésie locale' : 'Anesthésie générale'} sélectionnée</p>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button 
                  onClick={handleCancel}
                  className="flex-1 md:flex-none bg-gray-200 text-gray-700 rounded-xl px-6 py-3 text-sm font-bold transition-all duration-200 hover:bg-gray-300 hover:scale-105 active:scale-95 shadow-sm"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleConfirmRDV}
                  disabled={isSubmitting || isSuccess}
                  className={`flex-[2] md:flex-none px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-center flex items-center justify-center gap-2 ${
                    isSuccess 
                      ? 'bg-green-500 text-white shadow-lg' 
                      : 'bg-blue-600 text-white hover:scale-105 active:scale-95 hover:shadow-lg'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      Confirmation en cours...
                    </>
                  ) : isSuccess ? (
                    <>
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      Confirmé !
                    </>
                  ) : (
                    "Confirmer le RDV"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function PlanificationPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Chargement...</div>}>
        <PlanificationContent />
      </Suspense>
    </AppShell>
  );
}
