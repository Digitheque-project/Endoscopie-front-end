"use client";

import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { RequireRole } from "@/components/auth/RequireRole";
import { apiFetch, apiJson, apiUrl } from "@/lib/api";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePatient } from "@/contexts/PatientContext";
import StatBadge from "@/components/ui/StatBadge";

const INACTIVE_STATUTS = new Set(["Annulé", "Terminé"]);

function PlanificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientContext = usePatient();

  const patientId = searchParams.get("patientId") || patientContext.patientId || "";
  const patientName = searchParams.get("patientName") || patientContext.patientName || "MARIE LEFEBVRE";
  const priorityParam = searchParams.get("priority") || patientContext.priority || "NORMAL";
  const procedureParam = searchParams.get("procedure") || patientContext.procedure || "Fibroscopie Oeso-Gastro-Duodénale";
  const prescriptionId = searchParams.get("prescriptionId") || patientContext.prescriptionId || null;
  const medecinId = searchParams.get("medecinId") || null;

  const fromParam = searchParams.get("from");
  const from = fromParam === "agenda" ? "agenda" : fromParam === "patient-dossier" ? "patient-dossier" : "prescriptions";
  const returnUrl =
    from === "agenda"
      ? "/agenda-rendez-vous"
      : from === "patient-dossier" && prescriptionId
      ? `/patient-dossier/${encodeURIComponent(prescriptionId)}`
      : "/prescriptions";

  // Prescription multi-examens (ex. Coloscopie + Fibroscopie pour le même patient) :
  // liste de tous les examens à planifier l'un après l'autre, transmise depuis le fil
  // de prescription (voir handlePlanifier). Absent ou à un seul élément = examen simple.
  const groupExamsParam = searchParams.get("groupExams");
  const groupExams = useMemo<{ id: string; procedure: string; status: string }[]>(() => {
    if (!groupExamsParam) return [];
    try {
      const parsed = JSON.parse(groupExamsParam);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [groupExamsParam]);
  const [plannedExamIds, setPlannedExamIds] = useState<Set<string>>(new Set());

  const switchActiveExam = (exam: { id: string; procedure: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("prescriptionId", exam.id);
    params.set("procedure", exam.procedure);
    router.replace(`/planification-examens?${params.toString()}`);
    // Nouvel examen = nouveau rendez-vous : on repart d'un formulaire propre plutôt que
    // de risquer de réserver la même salle/horaire pour deux examens différents.
    setSelectedSalleId("");
    setHeureDebut("09:00");
    setHeureFin("10:00");
    setObservations("");
    setSlotError(null);
    setSubmitError(null);
    setIsSuccess(false);
  };

  const [medecinInfo, setMedecinInfo] = useState<any | null>(null);
  const [isMedecinLoading, setIsMedecinLoading] = useState(false);
  const [medecinError, setMedecinError] = useState<string | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<any | null>(null);
  const [isPrescriptionLoading, setIsPrescriptionLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const patientReal = prescriptionData?.patient || null;

  const getTodayLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [date, setDate] = useState(getTodayLocal());
  const [heureDebut, setHeureDebut] = useState("09:00");
  const [heureFin, setHeureFin] = useState("10:00");
  const [dateError, setDateError] = useState<string | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [isCheckingSlot, setIsCheckingSlot] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  /** Incrémenté pour forcer une nouvelle vérification de disponibilité sans changer de champ (bouton "Réessayer"). */
  const [slotCheckRetryCount, setSlotCheckRetryCount] = useState(0);

  const buildDateTime = (date: string, time: string) => new Date(`${date}T${time}`);

  // Validation de la date et des heures
  useEffect(() => {
    const start = buildDateTime(date, heureDebut);
    const end = buildDateTime(date, heureFin);

    if (end <= start) {
      setDateError("L'heure de fin doit être postérieure à l'heure de début.");
    } else if (start.getTime() < Date.now()) {
      setDateError("Impossible de planifier un rendez-vous dans le passé. Veuillez sélectionner une date et une heure valides.");
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

  useEffect(() => {
    const loadMedecin = async () => {
      try {
        setIsMedecinLoading(true);
        const medecins = await apiJson<any[]>('/api/medecins');
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
        const data = await apiJson<any>(`/api/prescriptions/${prescriptionId}`);
        setPrescriptionData(data);
      } catch (e) {
        console.error("Error fetching prescription details", e);
      } finally {
        setIsPrescriptionLoading(false);
      }
    };
    fetchPrescriptionDetails();

    const fetchSalles = async () => {
      try {
        const data = await apiJson<any[]>('/api/salles');
        setSalles(data);
      } catch (e) {
        console.error("Error fetching salles", e);
      }
    };
    fetchSalles();
  }, [medecinId, prescriptionId]);

  const priorityIndicator = useMemo(() => {
    const rawPriority = (prescriptionData?.priorite || searchParams.get("priority") || patientContext.priority || "NORMAL").toUpperCase();
    
    // Logic similar to prescriptions/page.tsx
    if (rawPriority === "STAT" || rawPriority === "URGENCE VITALE") {
      return {
        label: rawPriority === "STAT" ? "TRES URGENT" : "Urgent Vital",
        icon: "warning",
        className: "bg-red-600 text-white animate-pulse font-bold px-2 py-0.5 rounded-full shadow-md",
      };
    }
    if (rawPriority === "URGENT" || rawPriority === "URGENCE") {
      return { 
        label: "Urgent", 
        icon: "priority_high", 
        className: "bg-[#EA580C] hover:bg-[#C2410C] transition-all text-white font-bold shadow-sm px-3 py-1 rounded-full" 
      };
    }
    return {
      label: "Normale",
      icon: "check_circle",
      className: "bg-success-container text-success font-bold px-3 py-1 rounded-full"
    };
  }, [prescriptionData]);

  const prescriberLabel = useMemo(() => {
    if (medecinInfo) {
      return `Dr. ${medecinInfo.prenom} ${medecinInfo.nom}`;
    }

    return searchParams.get("prescriber") || patientContext.prescriber || "Dr. Antoine Moreau";
  }, [medecinInfo, searchParams, patientContext.prescriber]);

  // Sélection par id (pas par nom) : plusieurs salles peuvent partager le même nom
  // affiché (ex. "Salle 01" et "Salle 02" ont toutes deux nom="Salle"), seul l'id
  // les distingue de façon fiable — pour la mise en surbrillance comme pour la
  // détection de conflit de créneau.
  const [selectedSalleId, setSelectedSalleId] = useState("");
  const selectedSalleObj = salles.find((s: any) => s.id === selectedSalleId) || null;
  const selectedSalle = selectedSalleObj
    ? `${selectedSalleObj.nom} (${selectedSalleObj.numero})`
    : "";

  // Présélectionne la première salle active dès que la liste est chargée.
  useEffect(() => {
    if (selectedSalleId) return;
    const firstActive = salles.find((s: any) => s.estActive !== false);
    if (firstActive) setSelectedSalleId(firstActive.id);
  }, [salles, selectedSalleId]);

  /** Délai maximal pour la vérification de disponibilité — au-delà, on ne reste jamais bloqué en chargement infini. */
  const SLOT_CHECK_TIMEOUT_MS = 20000;

  /**
   * Vérifie à la fois la disponibilité de la salle ET du médecin sur le créneau —
   * le serveur valide aussi les deux (voir createRendezVous), mais sans ce
   * pré-contrôle côté médecin, un conflit médecin ne remontait qu'à la soumission
   * finale au lieu d'apparaître en direct comme pour la salle.
   */
  const checkConflicts = async (newStart: Date, newEnd: Date, salleId: string): Promise<"salle" | "medecin" | null> => {
    // Le créneau à planifier tient toujours sur une seule journée : on ne récupère que
    // les rendez-vous de ce jour-là (au lieu de la table entière, qui grossit avec le
    // temps) pour que cette vérification reste rapide même quand la base est sollicitée.
    const appointments = await apiJson<any[]>(`/api/rendezvous/jour/${date}`, {
      signal: AbortSignal.timeout(SLOT_CHECK_TIMEOUT_MS),
    });
    const overlapsSlot = (app: any) => {
      // Un rendez-vous annulé ou terminé ne bloque pas le créneau, et on ignore
      // le rendez-vous de cette même prescription (cas d'une replanification).
      if (INACTIVE_STATUTS.has(app.statut)) return false;
      if (prescriptionId && app.prescriptionId === prescriptionId) return false;
      const appStart = new Date(app.dateHeureDebut);
      const appEnd = new Date(app.dateHeureFin);
      return newStart < appEnd && newEnd > appStart;
    };
    // La salle accueille jusqu'à `capacite` patients en simultané (même logique
    // que createRendezVous côté serveur) — on ne bloque qu'une fois cette limite
    // atteinte, pas dès le premier chevauchement.
    const salleObj = salles.find((s: any) => s.id === salleId);
    const capacite = salleObj?.capacite > 0 ? salleObj.capacite : 1;
    const concurrentCount = appointments.filter((app: any) => app.salleId === salleId && overlapsSlot(app)).length;
    if (concurrentCount >= capacite) return "salle";
    if (medecinId && appointments.some((app: any) => app.medecinId === medecinId && overlapsSlot(app))) return "medecin";
    return null;
  };

  // Vérification automatique de la disponibilité du créneau (date + heure + salle)
  // dès que l'utilisateur modifie l'un de ces champs, avant tout envoi au serveur.
  useEffect(() => {
    setSubmitError(null);
    if (dateError) {
      // Toujours réinitialiser isCheckingSlot ici : sans ça, si cet effet avait déjà
      // démarré une vérification (isCheckingSlot=true) lors d'un rendu précédent
      // avant que dateError ne soit calculé, le spinner restait bloqué indéfiniment.
      setSlotError(null);
      setIsCheckingSlot(false);
      return;
    }

    if (!selectedSalleId) {
      setIsCheckingSlot(false);
      return;
    }

    // La salle a pu être désactivée entre-temps : on bloque immédiatement,
    // sans attendre la vérification de chevauchement.
    if (selectedSalleObj && selectedSalleObj.estActive === false) {
      setSlotError(`La salle "${selectedSalle}" n'est plus disponible. Veuillez choisir une autre salle.`);
      setIsCheckingSlot(false);
      return;
    }

    let cancelled = false;
    const start = buildDateTime(date, heureDebut);
    const end = buildDateTime(date, heureFin);

    setIsCheckingSlot(true);
    const timer = setTimeout(() => {
      checkConflicts(start, end, selectedSalleId)
        .then((reason) => {
          if (cancelled) return;
          setSlotError(
            reason === "salle"
              ? `La salle "${selectedSalle}" a atteint sa capacité maximale (${selectedSalleObj?.capacite ?? 1} patient${(selectedSalleObj?.capacite ?? 1) > 1 ? "s" : ""}) sur ce créneau. Veuillez choisir une autre date, un autre horaire, ou une autre salle.`
              : reason === "medecin"
              ? "Ce médecin a déjà un rendez-vous sur ce créneau. Veuillez choisir une autre date ou un autre horaire."
              : null,
          );
        })
        .catch((e) => {
          console.error("Error checking conflicts", e);
          if (cancelled) return;
          // On ne peut pas confirmer que la salle est libre : on bloque par prudence
          // plutôt que de laisser passer silencieusement un éventuel conflit.
          const isTimeout = e?.name === "TimeoutError" || e?.name === "AbortError";
          setSlotError(
            isTimeout
              ? "La vérification de la disponibilité prend trop de temps. Vérifiez votre connexion et réessayez."
              : "Impossible de vérifier la disponibilité de la salle. Veuillez réessayer.",
          );
        })
        .finally(() => {
          if (!cancelled) setIsCheckingSlot(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, heureDebut, heureFin, selectedSalleId, dateError, salles, slotCheckRetryCount]);

  const handleConfirmRDV = async () => {
    setSubmitError(null);

    // Garde-fou : revalide au moment de l'envoi (au cas où l'utilisateur aurait
    // soumis avant la fin de la vérification automatique en arrière-plan).
    const dateTimeDebut = buildDateTime(date, heureDebut);
    const dateTimeFin = buildDateTime(date, heureFin);

    if (dateTimeFin <= dateTimeDebut) {
      setSubmitError("L'heure de fin doit être postérieure à l'heure de début.");
      return;
    }

    if (dateTimeDebut.getTime() < Date.now()) {
      setSubmitError("Impossible de planifier un rendez-vous dans le passé. Veuillez sélectionner une date et une heure valides.");
      return;
    }

    if (!selectedSalleId || !selectedSalleObj) {
      setSlotError("Veuillez sélectionner une salle.");
      return;
    }
    if (selectedSalleObj.estActive === false) {
      setSlotError(`La salle "${selectedSalle}" n'est plus disponible. Veuillez choisir une autre salle.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const conflictReason = await checkConflicts(dateTimeDebut, dateTimeFin, selectedSalleId);
      if (conflictReason) {
        setSlotError(
          conflictReason === "salle"
            ? `La salle "${selectedSalle}" a atteint sa capacité maximale (${selectedSalleObj?.capacite ?? 1} patient${(selectedSalleObj?.capacite ?? 1) > 1 ? "s" : ""}) sur ce créneau. Veuillez choisir une autre date, un autre horaire, ou une autre salle.`
            : "Ce médecin a déjà un rendez-vous sur ce créneau. Veuillez choisir une autre date ou un autre horaire.",
        );
        setIsSubmitting(false);
        return;
      }

      // Construction de l'objet rendez-vous avec les informations du formulaire
      // Function to create a "naive" ISO string (no timezone/offset)
      // This ensures the database stores the EXACT hours/minutes selected
      const toNaiveISO = (d: Date) => {
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      };

      const appointmentData = {
        patientId: patientId || null,
        patientName: patientName,
        prescriptionId: prescriptionId || null,
        medecinId: medecinId || null,
        procedure: procedureParam,
        typeExamen: procedureParam,
        salleId: selectedSalleObj?.id || null,
        salle: selectedSalle,
        dateHeureDebut: toNaiveISO(dateTimeDebut),
        dateHeureFin: toNaiveISO(dateTimeFin),
        statut: priorityIndicator.label === 'Urgent' || priorityIndicator.label === 'TRES URGENT' ? 'Urgent' : 'Prevu',
        notesCliniques: observations || null,
      };

      // Sauvegarde en base de données via l'API
      const response = await apiFetch('/api/rendezvous', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData)
      });

      if (!response.ok) {
        const text = await response.text();
        let message = text;
        try {
          const parsed = JSON.parse(text);
          message = parsed.message || text;
        } catch {
          // texte brut, on le garde tel quel
        }
        throw new Error(message || `Erreur ${response.status} lors de la sauvegarde.`);
      }

      setIsSuccess(true);

      // Prescription multi-examens : reste sur la page pour enchaîner sur le prochain
      // examen non planifié plutôt que de quitter dès le premier rendez-vous confirmé.
      const justPlannedId = prescriptionId;
      const updatedPlanned = justPlannedId ? new Set(plannedExamIds).add(justPlannedId) : plannedExamIds;
      setPlannedExamIds(updatedPlanned);
      // `ex.status` reflète l'état réel côté serveur au moment où cette page a été
      // ouverte (voir handlePlanifier) — on s'y fie en plus de `plannedExamIds` (mémoire
      // client, perdue si la page est rechargée ou si l'utilisateur revient plus tard
      // planifier le dernier examen restant depuis le Fil de prescription), pour ne pas
      // reproposer un examen déjà planifié et ne jamais rebasculer vers le Fil.
      const nextExam = groupExams.find(
        (ex) => ex.id !== justPlannedId && ex.status === "A planifier" && !updatedPlanned.has(ex.id),
      );

      setTimeout(() => {
        if (nextExam) {
          switchActiveExam(nextExam);
        } else {
          router.push(returnUrl);
        }
      }, 1000);
    } catch (error: any) {
      console.error("Erreur lors de la synchronisation du rendez-vous:", error);
      const isTimeout = error?.name === "TimeoutError" || error?.name === "AbortError";
      setSubmitError(
        isTimeout
          ? "Impossible de vérifier la disponibilité de la salle (délai dépassé). Veuillez réessayer."
          : error instanceof Error ? error.message : "Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.",
      );
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
    <div className={PAGE_CONTENT_CLASS}>
      {/* Back Button */}
      <a href={returnUrl} className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/20 px-6 py-3 text-on-surface-variant hover:text-primary hover:border-primary transition-all">
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        <span className="font-semibold">
          {from === "agenda" ? "Retour à l'agenda" : from === "patient-dossier" ? "Retour au dossier patient" : "Retour au fil de prescription"}
        </span>
      </a>

      {/* Patient Header */}
      {!patientId && (
        <div className="mt-4 p-4 rounded-lg border border-error/20 bg-error-container/10 text-error text-sm">
          <strong>Attention :</strong> Aucune identité patient fiable fournie. Veuillez sélectionner une prescription depuis la file de prescription pour préremplir les informations, ou renseigner manuellement le patient.
        </div>
      )}
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
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-normal whitespace-nowrap ${priorityIndicator.className}`}>
                <span className="material-symbols-outlined text-[12px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {priorityIndicator.icon}
                </span>
                {priorityIndicator.label}
              </div>
            </div>
            <div className="mt-4 flex gap-12">
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Poids</p>
                <p className="text-sm font-bold">{patientReal?.poids ? `${patientReal.poids} kg` : "Non renseigné"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Groupe sanguin</p>
                <p className="text-sm font-bold">{patientReal?.groupeSanguin || "Non renseigné"}</p>
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

      {groupExams.length > 1 && (
        <section className="bg-white rounded-xl border border-outline-variant/30 p-6 shadow-sm">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
            Prescription multi-examens — {plannedExamIds.size}/{groupExams.length} planifiés
          </p>
          <p className="text-xs text-on-surface-variant mb-3">
            Choisissez l&apos;examen à planifier maintenant, puis passez au suivant une fois le rendez-vous confirmé.
          </p>
          <div className="flex flex-wrap gap-2">
            {groupExams.map((exam) => {
              const isActive = exam.id === prescriptionId;
              const isPlanned = plannedExamIds.has(exam.id) || (exam.status && exam.status !== "A planifier" && !isActive);
              return (
                <button
                  key={exam.id}
                  type="button"
                  onClick={() => switchActiveExam(exam)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : isPlanned
                      ? "bg-success-container text-success"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {isPlanned && !isActive && <span className="material-symbols-outlined text-[14px]">check_circle</span>}
                  {exam.procedure}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8 items-start">
        <div>
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
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">SALLE D'OPÉRATION</label>
                {(() => {
                  const sallesDisponibles = salles.filter((s: any) => s.estActive !== false);
                  if (sallesDisponibles.length === 0) {
                    return (
                      <p className="text-xs font-semibold text-on-surface-variant px-1 py-2">
                        {salles.length === 0 ? "Chargement des salles…" : "Aucune salle disponible actuellement."}
                      </p>
                    );
                  }
                  return (
                    <div role="group" aria-label="Salles disponibles" className="flex flex-wrap gap-2">
                      {sallesDisponibles.map((s: any) => {
                        const isSelected = selectedSalleId === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSelectedSalleId(s.id)}
                            aria-pressed={isSelected}
                            className={`px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all flex items-center gap-2 ${
                              isSelected
                                ? "border-primary bg-primary text-white shadow-md"
                                : slotError
                                ? "border-error/30 bg-surface-container-low text-on-surface hover:border-primary/50"
                                : "border-outline-variant bg-surface-container-low text-on-surface hover:border-primary/50"
                            }`}
                          >
                            <span className={`material-symbols-outlined text-[16px] ${isSelected ? "" : "text-primary"}`}>meeting_room</span>
                            {s.nom} ({s.numero})
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
                {isCheckingSlot && !slotError && (
                  <p className="text-[10px] font-semibold text-on-surface-variant px-1 flex items-center gap-1.5">
                    <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
                    Vérification de la disponibilité du créneau…
                  </p>
                )}
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
                        min={getTodayLocal()}
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

                {dateError && (
                  <div className="flex items-start gap-2 rounded-xl border border-error/30 bg-error-container/20 px-3 py-2.5 text-error animate-in fade-in duration-150">
                    <span className="material-symbols-outlined text-[18px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                    <p className="text-xs font-bold leading-snug">{dateError}</p>
                  </div>
                )}
                {slotError && (
                  <div className="flex items-start gap-2 rounded-xl border border-error/30 bg-error-container/20 px-3 py-2.5 text-error animate-in fade-in duration-150">
                    <span className="material-symbols-outlined text-[18px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold leading-snug">{slotError}</p>
                      {slotError.includes("Impossible de vérifier") || slotError.includes("trop de temps") ? (
                        <button
                          type="button"
                          onClick={() => setSlotCheckRetryCount((n) => n + 1)}
                          className="mt-1 text-xs font-bold underline hover:no-underline"
                        >
                          Réessayer
                        </button>
                      ) : null}
                    </div>
                  </div>
                )}
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
                  <p className="text-xs text-on-surface-variant font-medium">Le type d&apos;anesthésie sera décidé par le médecin après planification.</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <button
                    onClick={handleCancel}
                    className="flex-1 md:flex-none bg-gray-200 text-gray-700 rounded-xl px-6 py-3 text-sm font-bold transition-all duration-200 hover:bg-gray-300 hover:scale-105 active:scale-95 shadow-sm"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirmRDV}
                    disabled={isSubmitting || isSuccess || !!dateError || !!slotError || isCheckingSlot}
                    className={`flex-[2] md:flex-none px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-center flex items-center justify-center gap-2 disabled:opacity-60 ${
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
                {submitError && (
                  <div className="flex w-full items-start gap-2 rounded-xl border border-error/30 bg-error-container/20 px-3 py-2.5 text-error animate-in fade-in duration-150">
                    <span className="material-symbols-outlined text-[18px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                    <p className="text-xs font-bold leading-snug">{submitError}</p>
                  </div>
                )}
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
      <RequireRole role="MAJOR">
        <Suspense fallback={<div className="p-8 text-center text-slate-500">Chargement...</div>}>
          <PlanificationContent />
        </Suspense>
      </RequireRole>
    </AppShell>
  );
}
