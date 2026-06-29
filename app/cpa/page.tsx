"use client";

import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import StatBadge from "@/components/ui/StatBadge";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { usePatient } from "@/contexts/PatientContext";
import { apiJson, createDossierCpa } from "@/lib/api";

function computeAge(dateNaissance?: string | null): number | null {
  if (!dateNaissance) return null;
  const birth = new Date(dateNaissance);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

function CPAContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientContext = usePatient();

  const patientId = searchParams.get("patientId") || patientContext.patientId || "";
  const prescriptionId = searchParams.get("prescriptionId") || patientContext.prescriptionId || "";
  const isValidPatient = !!patientId && !patientId.startsWith("#");

  const [patient, setPatient] = useState<any>(null);
  const [prescription, setPrescription] = useState<any>(null);
  const [anesthesie, setAnesthesie] = useState<"Locale" | "Générale" | null>(null);
  const [observations, setObservations] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isValidPatient) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiJson<any>(`/api/patients/${encodeURIComponent(patientId)}`);
        if (!cancelled) setPatient(data);
      } catch (err) {
        console.error("Erreur chargement patient CPA :", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId, isValidPatient]);

  useEffect(() => {
    if (!prescriptionId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiJson<any>(`/api/prescriptions/${prescriptionId}`);
        if (!cancelled) setPrescription(data);
      } catch (err) {
        console.error("Erreur chargement prescription CPA :", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [prescriptionId]);

  const patientName = patient ? `${patient.nom} ${patient.prenom}` : patientContext.patientName || "Patient inconnu";
  const age = computeAge(patient?.dateNaissance);
  const gender = patient?.sexe === "F" ? "Femme" : patient?.sexe === "M" ? "Homme" : null;
  const prescripteur = prescription?.medecinPrescripteur
    ? `Dr. ${prescription.medecinPrescripteur.prenom} ${prescription.medecinPrescripteur.nom}`
    : patientContext.prescriber || "Non spécifié";
  const typeExamen = prescription?.typeExamen || patientContext.procedure || "Non spécifié";
  const motif = prescription?.motif || "Aucun motif renseigné.";
  const antecedents = patient?.antecedentsMedicaux || "Aucun antécédent renseigné.";
  const priority = (prescription?.priorite || patientContext.priority || "NORMAL").toUpperCase();
  const urgencyLabel =
    priority === "STAT" ? "Urgence vitale" : priority === "URGENT" ? "Urgent (24h)" : priority === "PRIORITAIRE" ? "Prioritaire (24h)" : "Standard (48h)";

  const handleSubmit = async () => {
    if (!isValidPatient) {
      setSubmitError("Patient non valide. Sélectionnez d'abord une prescription ou un dossier patient valide.");
      return;
    }
    if (!anesthesie) {
      setSubmitError("Veuillez choisir le type d'anesthésie avant de valider.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await createDossierCpa({
        patientId,
        prescriptionId: prescriptionId || undefined,
        typeAnesthesie: anesthesie,
        observations: observations || undefined,
        statut: "Soumise",
      });
      setIsSuccess(true);
    } catch (err) {
      console.error("Erreur lors de l'envoi de la demande CPA", err);
      setSubmitError(err instanceof Error ? err.message : "Erreur de communication avec le backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        <a
          href="/prescriptions"
          className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/20 px-6 py-3 text-on-surface-variant hover:text-primary hover:border-primary transition-all"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span className="font-semibold">Retour au fil de prescription</span>
        </a>

        {!isValidPatient && (
          <div className="p-4 rounded-lg border border-error/20 bg-error-container/10 text-error text-sm">
            <strong>Attention :</strong> Aucune identité patient fiable fournie. Sélectionnez une prescription depuis le fil de prescription pour préremplir ce dossier.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-outline-variant/20 shadow-sm flex items-center gap-8 relative overflow-hidden">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl object-cover bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-4xl text-primary">person</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-black text-on-surface tracking-tight">{patientName}</h2>
                <StatBadge />
              </div>
              <div className="flex items-center gap-4 text-sm font-semibold text-on-surface-variant">
                <span>
                  {gender || "—"}
                  {age != null ? `, ${age} ans` : ""}
                </span>
                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                <span className="text-primary font-bold">{patient?.groupeSanguin ? `Groupe ${patient.groupeSanguin}` : "Groupe non renseigné"}</span>
              </div>
              <div className="mt-6 flex gap-12">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Poids</p>
                  <p className="text-lg font-bold text-on-surface">{patient?.poids != null ? `${patient.poids} kg` : "Non renseigné"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-secondary-container/20 p-8 rounded-2xl border border-secondary-container/30 relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Médecin Prescripteur</p>
                <h3 className="text-xl font-bold text-on-surface">{prescripteur}</h3>
              </div>
              <div className="pt-4 border-t border-secondary-container/40">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Examen Demandé</p>
                <p className="text-sm font-bold text-on-surface leading-snug">{typeExamen}</p>
              </div>
            </div>
          </div>
        </div>

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
              <p className="text-base font-semibold text-on-surface leading-snug">
                Le choix entre anesthésie locale et générale doit être fait avant validation de la demande.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-right">Sélection requise</p>
              <div className="flex items-center rounded-2xl border border-outline-variant/30 bg-surface-container p-1.5 shadow-inner">
                <button
                  type="button"
                  onClick={() => setAnesthesie("Locale")}
                  className={`min-w-[11rem] px-6 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    anesthesie === "Locale" ? "bg-white text-primary shadow-sm border border-outline-variant/10 font-bold" : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  Anesthésie locale
                </button>
                <button
                  type="button"
                  onClick={() => setAnesthesie("Générale")}
                  className={`min-w-[11rem] px-6 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    anesthesie === "Générale" ? "bg-white text-primary shadow-sm border border-outline-variant/10 font-bold" : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  Anesthésie générale
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface-container p-8 rounded-2xl border border-outline-variant/10">
              <h4 className="font-bold text-on-surface mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">clinical_notes</span>
                Contexte Clinique
              </h4>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Motif de l&apos;examen</p>
                  <div className="bg-white p-4 rounded-xl border border-outline-variant/10">
                    <p className="text-sm font-medium text-on-surface leading-relaxed">{motif}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Antécédents médicaux</p>
                  <div className="bg-white p-4 rounded-xl border border-outline-variant/10">
                    <p className="text-sm font-medium text-on-surface-variant leading-relaxed">{antecedents}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <section className="bg-white p-10 rounded-2xl border border-outline-variant/20 shadow-sm space-y-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-on-surface">Demande de CPA</h3>
                  <p className="text-[10px] text-on-surface-variant mt-1 uppercase tracking-[0.2em] font-bold">Consultation Pré-Anesthésique</p>
                </div>
                <div className="flex items-center gap-2 text-on-secondary-container bg-secondary-container/20 px-4 py-2 rounded-lg border border-secondary-container/20">
                  <span className="material-symbols-outlined text-lg">history_edu</span>
                  <span className="text-xs font-bold">{isSuccess ? "Soumise" : "Brouillon en cours"}</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.1em]">
                  Observations cliniques &amp; détails de l&apos;intervention
                </label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full min-h-[300px] bg-surface-container-low rounded-xl p-5 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/40 resize-none leading-relaxed border-none focus:ring-2 focus:ring-primary"
                  placeholder="Saisissez les antécédents, l'indication chirurgicale et les observations particulières..."
                />
                {submitError && <div className="rounded-2xl border border-error/20 bg-error-container/10 p-4 text-sm text-error">{submitError}</div>}
                {isSuccess && (
                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-50 p-4 text-sm text-emerald-700">
                    Demande CPA enregistrée avec succès.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/10">
                  <span className="material-symbols-outlined text-primary mb-3 block text-xl">person_search</span>
                  <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Demandeur</p>
                  <p className="text-sm font-black text-on-surface">{prescripteur}</p>
                </div>
                <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/10">
                  <span className="material-symbols-outlined text-primary mb-3 block text-xl font-bold">priority_high</span>
                  <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Urgence</p>
                  <p className="text-sm font-black text-on-surface">{urgencyLabel}</p>
                </div>
                <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/10">
                  <span className="material-symbols-outlined text-primary mb-3 block text-xl">calendar_today</span>
                  <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Date de la demande</p>
                  <p className="text-sm font-black text-on-surface">{new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</p>
                </div>
              </div>

              <footer className="flex items-center justify-between pt-8 border-t border-outline-variant/10">
                <div className="flex items-center gap-4 text-on-surface-variant/80 max-w-[60%]">
                  <span className="material-symbols-outlined text-xl shrink-0">info</span>
                  <p className="text-xs leading-tight font-medium italic">La validation enverra une notification immédiate au service d&apos;anesthésie.</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 rounded-xl text-sm font-bold text-on-surface bg-surface-container-high hover:bg-outline-variant/20 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">save</span>
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || isSuccess}
                    className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-lg">send</span>
                    {isSubmitting ? "Envoi en cours…" : isSuccess ? "Envoyé" : "Valider la demande"}
                  </button>
                </div>
              </footer>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function CPAPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Chargement...</div>}>
      <CPAContent />
    </Suspense>
  );
}
