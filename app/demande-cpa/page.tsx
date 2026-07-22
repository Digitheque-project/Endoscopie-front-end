"use client";

import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { RequireRole } from "@/components/auth/RequireRole";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { usePatient } from "@/contexts/PatientContext";
import { apiJson, apiUrl, createDossierCpa, updateRendezVous } from "@/lib/api";

function computeAge(dateNaissance?: string | null): number | null {
  if (!dateNaissance) return null;
  const birth = new Date(dateNaissance);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

/** Traduit la priorité brute en badge d'urgence — mêmes règles/couleurs que le dossier patient. */
function getUrgenceBadge(priorite?: string | null): { label: string; icon: string; className: string } {
  const p = priorite?.trim().toUpperCase();
  if (p === "STAT" || p === "URGENCE VITALE") {
    return { label: "TRES URGENT", icon: "warning", className: "bg-red-600 text-white animate-pulse" };
  }
  if (p === "URGENT" || p === "URGENCE") {
    return { label: "Urgent", icon: "priority_high", className: "bg-[#EA580C] text-white" };
  }
  return { label: "Normale", icon: "check_circle", className: "bg-success-container text-success" };
}

function DemandeCPAContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const patientContext = usePatient();
  const patientId = searchParams.get("patientId") || patientContext.patientId || "";
  const paramPatientName = searchParams.get("patientName");
  const [fetchedPatientName, setFetchedPatientName] = useState<string | null>(null);
  const paramsPriority = searchParams.get("priority") || patientContext.priority || "NORMAL";
  const patientName = fetchedPatientName || paramPatientName || patientContext.patientName || "MARIE LEFEBVRE";
  const prescriber = searchParams.get("prescriber") || patientContext.prescriber || "Dr. Antoine Moreau";
  const procedureParam = searchParams.get("procedure") || patientContext.procedure || "";
  const priorityState = paramsPriority.toUpperCase();
  const urgenceBadge = getUrgenceBadge(priorityState);

  const prescriptionId = searchParams.get("prescriptionId") || patientContext.prescriptionId || null;

  const [observations, setObservations] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [accueilPatient, setAccueilPatient] = useState<any>(null);
  const [prescriptionData, setPrescriptionData] = useState<any>(null);
  const [rendezVous, setRendezVous] = useState<any>(null);

  const age = computeAge(accueilPatient?.dateNaissance);
  const sexeLabel = accueilPatient?.sexe === "F" ? "Femme" : accueilPatient?.sexe === "M" ? "Homme" : null;
  const examenDemande = procedureParam || prescriptionData?.typeExamen || "Examen non précisé";
  const motif = prescriptionData?.motif || "Aucun motif renseigné.";
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleHeure, setRescheduleHeure] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!patientId) {
      setSubmitError("Patient non valide. Sélectionnez d'abord une prescription ou un dossier patient valide.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createDossierCpa({
        patientId,
        prescriptionId: searchParams.get("prescriptionId") || patientContext.prescriptionId || undefined,
        typeAnesthesie: "Générale",
        observations: observations || undefined,
        statut: "Soumise",
      });
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/prescriptions");
      }, 800);
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande CPA", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Erreur de communication avec le backend."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!patientId) return;

    let mounted = true;
    (async () => {
      try {
        const data = await apiJson<any>(`/api/patients/${encodeURIComponent(patientId)}`);
        if (!mounted) return;
        setAccueilPatient(data);
        const name = `${data.nom || ''} ${data.prenom || ''}`.trim();
        if (name) {
          setFetchedPatientName(name);
          try { patientContext.setPatientData({ patientName: name }); } catch (e) {}
        }
      } catch (e) {
        // ignore fetch errors
      }
    })();

    return () => { mounted = false; };
  }, [patientId, patientContext]);

  useEffect(() => {
    if (!prescriptionId) return;

    let mounted = true;
    (async () => {
      try {
        const data = await apiJson<any>(`/api/prescriptions/${encodeURIComponent(prescriptionId)}`);
        if (!mounted) return;
        setPrescriptionData(data);
        setRendezVous(data.rendezVous || null);
      } catch (e) {
        // ignore fetch errors
      }
    })();

    return () => { mounted = false; };
  }, [prescriptionId]);

  const handleOpenReschedule = () => {
    if (rendezVous?.dateHeureDebut) {
      const d = new Date(rendezVous.dateHeureDebut);
      const pad = (n: number) => n.toString().padStart(2, "0");
      setRescheduleDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
      setRescheduleHeure(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
    }
    setRescheduleSuccess(false);
    setRescheduleError(null);
    setShowReschedule(true);
  };

  const handleConfirmReschedule = async () => {
    if (!rendezVous?.id || !rescheduleDate || !rescheduleHeure) return;
    setIsRescheduling(true);
    setRescheduleError(null);
    try {
      const newDateTime = `${rescheduleDate}T${rescheduleHeure}:00`;
      const updated = await updateRendezVous(rendezVous.id, { dateHeureDebut: newDateTime });
      setRendezVous((prev: any) => ({ ...prev, ...updated }));
      setRescheduleSuccess(true);
      setShowReschedule(false);
    } catch (err) {
      setRescheduleError(err instanceof Error ? err.message : "Erreur lors du décalage du rendez-vous.");
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        <RequireRole role="MAJOR">
        {/* Back Button */}
        <a href="/prescriptions" className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/20 px-6 py-3 text-on-surface-variant hover:text-primary hover:border-primary transition-all">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span className="font-semibold">Retour au fil de prescription</span>
        </a>

        {/* Patient Profile Summary */}
        {(!patientId) && (
          <div className="mt-4 p-4 rounded-lg border border-error/20 bg-error-container/10 text-error text-sm">
            <strong>Attention :</strong> Aucune identité patient fiable fournie. Veuillez sélectionner une prescription depuis la file de prescription pour préremplir les informations, ou renseigner manuellement le patient.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white p-4 rounded-2xl border border-outline-variant/20 shadow-sm flex items-center gap-5 relative overflow-hidden">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl object-cover bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-2xl text-primary">person</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h2 className="text-lg font-black text-on-surface tracking-tight">{patientName}</h2>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${urgenceBadge.className}`}>
                  <span className="material-symbols-outlined text-sm">{urgenceBadge.icon}</span>
                  {urgenceBadge.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-on-surface-variant">
                <span>
                  {[sexeLabel, age != null ? `${age} ans` : null].filter(Boolean).join(", ") || "Non renseigné"}
                </span>
              </div>
              <div className="mt-3 flex gap-6">
                <div>
                  <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">Poids</p>
                  <p className="text-sm font-bold text-on-surface">
                    {accueilPatient?.poids != null ? `${accueilPatient.poids} kg` : "Non renseigné"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-secondary-container/20 p-4 rounded-2xl border border-secondary-container/30 relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div>
                <p className="text-[9px] font-bold text-primary uppercase tracking-widest mb-1">Médecin Prescripteur</p>
                <h3 className="text-sm font-bold text-on-surface">{prescriber || "Non renseigné"}</h3>
              </div>
              <div className="pt-3 border-t border-secondary-container/40">
                <p className="text-[9px] font-bold text-primary uppercase tracking-widest mb-1">Examen Demandé</p>
                <p className="text-xs font-bold text-on-surface leading-snug">{examenDemande}</p>
              </div>
            </div>
          </div>
        </div>

        {rendezVous && (
          <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Rendez-vous d&apos;endoscopie planifié
              </p>
              <p className="text-base font-bold text-on-surface">
                {new Date(rendezVous.dateHeureDebut).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}
              </p>
              <p className="text-sm text-on-surface-variant mt-0.5">{rendezVous.salle?.nom || "Salle non renseignée"}</p>
              {rescheduleSuccess && (
                <p className="text-sm font-semibold text-emerald-600 mt-2">Rendez-vous décalé avec succès.</p>
              )}
              {rescheduleError && <p className="text-sm text-error mt-2">{rescheduleError}</p>}
            </div>

            {!showReschedule ? (
              <button
                type="button"
                onClick={handleOpenReschedule}
                className="px-5 py-3 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-colors whitespace-nowrap"
              >
                Décaler le rendez-vous
              </button>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Nouvelle date</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="bg-surface-container-low rounded-lg px-3 py-2 text-sm font-bold text-on-surface border-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Nouvelle heure</label>
                  <input
                    type="time"
                    value={rescheduleHeure}
                    onChange={(e) => setRescheduleHeure(e.target.value)}
                    className="bg-surface-container-low rounded-lg px-3 py-2 text-sm font-bold text-on-surface border-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowReschedule(false)}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isRescheduling}
                  onClick={handleConfirmReschedule}
                  className="px-5 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
                >
                  {isRescheduling ? "Décalage…" : "Confirmer le décalage"}
                </button>
              </div>
            )}
          </section>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left Column: Clinical Context */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/10">
              <h4 className="font-bold text-on-surface mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">clinical_notes</span>
                Détails de la prescription
              </h4>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Motif de l'examen</p>
                  <div className="bg-white p-4 rounded-xl border border-outline-variant/10">
                    <p className="text-sm font-medium text-on-surface leading-relaxed">{motif}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Antécédents médicaux</p>
                  <p className="text-sm font-medium text-on-surface-variant">
                    {accueilPatient?.antecedentsMedicaux || "Aucun antécédent renseigné."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: CPA Form */}
          <div className="lg:col-span-3">
            <section className="bg-white p-6 rounded-2xl border border-outline-variant/20 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-on-surface">Demande de CPA</h3>
                  <p className="text-[10px] text-on-surface-variant mt-1 uppercase tracking-[0.2em] font-bold">Consultation Pré-Anesthésique</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.1em]">
                  Observations cliniques &amp; détails de l'intervention
                </label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full min-h-[300px] bg-surface-container-low rounded-xl p-5 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/40 resize-none leading-relaxed border-none focus:ring-2 focus:ring-primary"
                  placeholder="Saisissez les antécédents, l'indication chirurgicale et les observations particulières..."
                />
                {submitError && (
                  <div className="rounded-2xl border border-error/20 bg-error-container/10 p-4 text-sm text-error">
                    {submitError}
                  </div>
                )}
                {isSuccess && (
                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-50 p-4 text-sm text-emerald-700">
                    Demande CPA enregistrée avec succès. Redirection en cours...
                  </div>
                )}
              </div>



              <footer className="flex items-center justify-end pt-8 border-t border-outline-variant/10">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-8 py-3 rounded-xl text-sm font-bold border border-outline-variant/20 text-on-surface hover:bg-surface-container transition-all"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || isSuccess}
                    className={`px-8 py-3 rounded-xl text-sm font-bold text-white transition-all ${
                      isSubmitting || isSuccess
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary/90'
                    }`}
                  >
                    {isSubmitting ? 'Envoi en cours…' : isSuccess ? 'Envoyé' : 'Valider la demande'}
                  </button>
                </div>
              </footer>
            </section>
          </div>
        </div>
        </RequireRole>
      </div>
    </AppShell>
  );
}

export default function DemandeCPAPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500">Chargement...</div>}>
      <DemandeCPAContent />
    </Suspense>
  );
}
