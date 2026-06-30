"use client";

import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { apiFetch, apiJson } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePatient } from "@/contexts/PatientContext";

const SLOTS = ["08:30", "09:15", "10:00", "11:30", "13:45", "14:30", "15:15", "16:00"];
const SLOT_DURATION_MINUTES = 45;

function getTodayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function PlanificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientContext = usePatient();

  const patientId = searchParams.get("patientId") || patientContext.patientId || "";
  const isValidPatient = !!patientId && !patientId.startsWith("#");
  const prescriptionId = searchParams.get("prescriptionId") || patientContext.prescriptionId || "";

  const [prescription, setPrescription] = useState<any>(null);
  const [medecins, setMedecins] = useState<any[]>([]);
  const [salles, setSalles] = useState<any[]>([]);
  const [rendezVous, setRendezVous] = useState<any[]>([]);

  const [date, setDate] = useState(getTodayLocal());
  const [selectedMedecinId, setSelectedMedecinId] = useState<string>("");
  const [selectedSalleId, setSelectedSalleId] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>(SLOTS[1]);
  const [anesthesie, setAnesthesie] = useState<"Locale" | "Générale" | null>(null);
  const [observations, setObservations] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formattedCurrentDate = useMemo(() => {
    const d = new Date(date);
    return d
      .toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      .replace(/^\w/, (c) => c.toUpperCase());
  }, [date]);

  useEffect(() => {
    if (prescriptionId) {
      apiJson<any>(`/api/prescriptions/${prescriptionId}`)
        .then(setPrescription)
        .catch((err) => console.error("Erreur chargement prescription planification :", err));
    }
    apiJson<any[]>("/api/medecins")
      .then((data) => setMedecins(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Erreur chargement médecins :", err));
    apiJson<any[]>("/api/salles")
      .then((data) => setSalles(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Erreur chargement salles :", err));
    apiJson<any[]>("/api/rendezvous")
      .then((data) => setRendezVous(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Erreur chargement rendez-vous :", err));
  }, [prescriptionId]);

  const patientName = prescription?.patient
    ? `${prescription.patient.nom} ${prescription.patient.prenom}`
    : patientContext.patientName || "Patient inconnu";
  const prescripteur = prescription?.medecinPrescripteur
    ? `Dr. ${prescription.medecinPrescripteur.prenom} ${prescription.medecinPrescripteur.nom}`
    : patientContext.prescriber || "Non spécifié";
  const typeExamen = prescription?.typeExamen || patientContext.procedure || "Non spécifié";
  const motif = prescription?.motif || "Aucun motif renseigné.";
  const antecedents = prescription?.patient?.antecedentsMedicaux || "Aucun antécédent renseigné.";
  const priority = (prescription?.priorite || patientContext.priority || "NORMAL").toUpperCase();

  const buildSlotRange = (slot: string) => {
    const start = new Date(`${date}T${slot}:00`);
    const end = new Date(start.getTime() + SLOT_DURATION_MINUTES * 60000);
    return { start, end };
  };

  const isSlotTaken = (slot: string) => {
    if (!selectedSalleId) return false;
    const { start, end } = buildSlotRange(slot);
    return rendezVous.some((rdv) => {
      if (rdv.salleId !== selectedSalleId && rdv.salle?.id !== selectedSalleId) return false;
      const rdvStart = new Date(rdv.dateHeureDebut);
      const rdvEnd = rdv.dateHeureFin ? new Date(rdv.dateHeureFin) : new Date(rdvStart.getTime() + SLOT_DURATION_MINUTES * 60000);
      return start < rdvEnd && end > rdvStart;
    });
  };

  const handleSubmit = async () => {
    if (!isValidPatient) {
      setSubmitError("Patient non valide. Sélectionnez d'abord une prescription depuis le fil de prescription.");
      return;
    }
    if (!anesthesie) {
      setSubmitError("Veuillez choisir le type d'anesthésie avant de confirmer.");
      return;
    }
    if (isSlotTaken(selectedSlot)) {
      setSubmitError("Ce créneau est déjà occupé pour la salle sélectionnée.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { start, end } = buildSlotRange(selectedSlot);
      const toNaiveISO = (d: Date) => {
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
      };
      const selectedMedecin = medecins.find((m) => m.id === selectedMedecinId);

      const payload = {
        patientId,
        prescriptionId: prescriptionId || null,
        medecinId: selectedMedecinId || null,
        salleId: selectedSalleId || null,
        dateHeureDebut: toNaiveISO(start),
        dateHeureFin: toNaiveISO(end),
        typeAnesthesie: anesthesie,
        statut: priority === "STAT" || priority === "URGENT" ? "Urgent" : "Confirmé",
        notesCliniques: observations || null,
      };

      const response = await apiFetch("/api/rendezvous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur ${response.status} : ${text}`);
      }

      setIsSuccess(true);
      setTimeout(() => router.push("/agenda-rendez-vous"), 1000);
    } catch (err) {
      console.error("Erreur lors de la planification :", err);
      setSubmitError(err instanceof Error ? err.message : "Erreur de communication avec le backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const { start: selectedStartDate, end: selectedEndDate } = buildSlotRange(selectedSlot);

  return (
    <div className={PAGE_CONTENT_CLASS}>
      <a
        href="/prescriptions"
        className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/20 px-6 py-3 text-on-surface-variant hover:text-primary hover:border-primary transition-all"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        <span className="font-semibold">Retour au fil de prescription</span>
      </a>

      {!isValidPatient && (
        <div className="mt-4 p-4 rounded-lg border border-error/20 bg-error-container/10 text-error text-sm">
          <strong>Attention :</strong> Aucune identité patient fiable fournie. Sélectionnez une prescription depuis le fil de prescription pour préremplir ce dossier.
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
              <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1 uppercase shadow-sm">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  warning
                </span>
                {priority}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-secondary-fixed p-6 rounded-xl flex flex-col justify-between border border-outline-variant/10 shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-on-secondary-fixed-variant uppercase tracking-wider mb-1">MÉDECIN PRESCRIPTEUR</p>
            <p className="font-headline font-bold text-on-secondary-fixed text-lg">{prescripteur}</p>
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-bold text-on-secondary-fixed-variant uppercase tracking-wider mb-1">EXAMEN DEMANDÉ</p>
            <p className="text-sm font-bold text-on-secondary-fixed leading-tight">{typeExamen}</p>
          </div>
        </div>
      </section>

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
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Choix d&apos;anesthésie</p>
            </div>
            <p className="text-base font-semibold text-on-surface leading-snug">Sélectionnez l&apos;anesthésie avant de finaliser la planification du créneau.</p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-right">Sélection requise</p>
            <div className="flex items-center rounded-2xl border border-outline-variant/30 bg-surface-container p-1.5 shadow-inner">
              <button
                type="button"
                onClick={() => setAnesthesie("Locale")}
                className={`min-w-[11rem] px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                  anesthesie === "Locale" ? "bg-white text-primary shadow-sm border border-outline-variant/10 font-bold" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Anesthésie locale
              </button>
              <button
                type="button"
                onClick={() => setAnesthesie("Générale")}
                className={`min-w-[11rem] px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                  anesthesie === "Générale" ? "bg-white text-primary shadow-sm border border-outline-variant/10 font-bold" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Anesthésie générale
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/20 shadow-sm">
            <h4 className="font-headline font-bold text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">clinical_notes</span>
              Contexte Clinique
            </h4>
            <div className="space-y-5">
              <div className="bg-white p-4 rounded-lg border border-outline-variant/10">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">MOTIF DE L&apos;EXAMEN</p>
                <p className="text-sm text-on-surface font-medium leading-relaxed">{motif}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">HISTORIQUE MÉDICAL</p>
                <p className="text-sm text-on-surface-variant font-medium leading-relaxed">{antecedents}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-white p-8 rounded-xl border border-outline-variant/30 shadow-md space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">Planification du créneau</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-primary text-sm">calendar_today</span>
                  <p className="text-sm font-bold text-primary">{formattedCurrentDate}</p>
                  <button
                    onClick={() => setDate(getTodayLocal())}
                    className="ml-2 px-2 py-0.5 rounded-md bg-primary/10 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/20 transition-all"
                  >
                    Aujourd&apos;hui
                  </button>
                </div>
                <p className="text-sm text-on-surface-variant mt-1.5 font-medium">Étape 2 sur 3 : Sélection des ressources</p>
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-sm font-bold text-on-surface border border-outline-variant/40 rounded-lg px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">CHIRURGIEN SÉLECTIONNÉ</label>
                <select
                  value={selectedMedecinId}
                  onChange={(e) => setSelectedMedecinId(e.target.value)}
                  className="w-full appearance-none bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-4 py-3.5 rounded-t-lg text-sm font-bold text-on-surface transition-all focus:ring-0"
                >
                  <option value="">Sélectionner un médecin</option>
                  {medecins.map((m) => (
                    <option key={m.id} value={m.id}>
                      Dr. {m.prenom} {m.nom}
                      {m.specialite ? ` — ${m.specialite}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">SALLE D&apos;OPÉRATION (BLOC)</label>
                <div className="flex gap-2 h-[48px] flex-wrap">
                  {salles.length === 0 ? (
                    <p className="text-xs text-on-surface-variant">Aucune salle disponible.</p>
                  ) : (
                    salles.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSalleId(s.id)}
                        className={`flex-1 text-xs font-black rounded-lg border-2 transition-all ${
                          selectedSalleId === s.id ? "border-primary text-primary bg-primary-container/10" : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
                        }`}
                      >
                        {s.nom}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">CRÉNEAUX DISPONIBLES</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SLOTS.map((slot) => {
                  const taken = isSlotTaken(slot);
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={taken}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-3.5 rounded-lg text-sm font-bold transition-all ${
                        taken
                          ? "bg-surface-container text-on-surface-variant opacity-40 cursor-not-allowed"
                          : isSelected
                          ? "bg-primary text-on-primary shadow-lg shadow-primary/20 ring-2 ring-primary ring-offset-2 transform scale-105"
                          : "bg-surface-container-low border border-outline-variant/10 text-on-surface hover:bg-primary-container/10 hover:text-primary"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.1em]">Observations cliniques &amp; détails de l&apos;intervention</label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full min-h-[200px] bg-surface-container-low rounded-xl p-5 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/40 resize-none leading-relaxed border-none focus:ring-2 focus:ring-primary"
                placeholder="Saisissez les antécédents, l'indication chirurgicale et les observations particulières..."
              />
            </div>

            {submitError && <div className="rounded-2xl border border-error/20 bg-error-container/10 p-4 text-sm text-error">{submitError}</div>}

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
                    {selectedStartDate.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "short" })} •{" "}
                    {selectedStartDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-xs text-on-surface-variant font-medium">{anesthesie ? `Anesthésie ${anesthesie.toLowerCase()} sélectionnée` : "Anesthésie non sélectionnée"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 md:flex-none px-6 py-3 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-all"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || isSuccess}
                  className="flex-[2] md:flex-none px-10 py-3 rounded-lg text-sm font-bold text-on-primary bg-primary shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all text-center disabled:opacity-50"
                >
                  {isSubmitting ? "Confirmation…" : isSuccess ? "Confirmé !" : "Confirmer le RDV"}
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
