"use client";

import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { PriseEnChargeBadge } from "@/components/patient/PriseEnChargeBadge";
import { ObservationTab } from "@/components/patient-dossier/dossier-tabs/ObservationTab";
import { DiagnosticTab } from "@/components/patient-dossier/dossier-tabs/DiagnosticTab";
import { SuiviTab } from "@/components/patient-dossier/dossier-tabs/SuiviTab";
import { ParametresTab } from "@/components/patient-dossier/dossier-tabs/ParametresTab";
import { HistoriqueTab } from "@/components/patient-dossier/dossier-tabs/HistoriqueTab";
import { ResultatsParacliniquesTab } from "@/components/patient-dossier/dossier-tabs/ResultatsParacliniquesTab";
import { AvisTab } from "@/components/patient-dossier/dossier-tabs/AvisTab";
import { PrescriptionTab } from "@/components/patient-dossier/dossier-tabs/PrescriptionTab";
import { CompteRenduOperatoireTab } from "@/components/patient-dossier/dossier-tabs/CompteRenduOperatoireTab";
import { SortieTab } from "@/components/patient-dossier/dossier-tabs/SortieTab";

interface PatientDossierInfoContentProps {
  prescriptionId: string;
}

// Même modal que les autres services CHU consommant le dossier patient partagé (ex. ORL) —
// deux rangées, même ordre. "Avis" et "Sortie" n'ont pas encore de source de données
// accessible depuis Endoscopie (voir AvisTab/SortieTab) ; "Prescription" et "Compte rendu
// opératoire" montrent les propres données Endoscopie du patient (pas le dossier CHU
// partagé, qui n'a pas cette notion).
const DOSSIER_TABS = [
  { key: "observation", label: "Observation médicale", icon: "stethoscope" },
  { key: "diagnostic", label: "Diagnostic", icon: "monitor_heart" },
  { key: "suivi", label: "Suivi / Évolution", icon: "timeline" },
  { key: "parametres", label: "Paramètres", icon: "speed" },
  { key: "avis", label: "Avis", icon: "forum" },
  { key: "prescription", label: "Prescription", icon: "assignment" },
  { key: "compte-rendu-operatoire", label: "Compte rendu opératoire", icon: "content_cut" },
  { key: "resultats", label: "Résultats paracliniques", icon: "biotech" },
  { key: "sortie", label: "Sortie", icon: "logout" },
  { key: "historique", label: "Historique", icon: "history" },
] as const;
type DossierTabKey = (typeof DOSSIER_TABS)[number]["key"];

function computeAge(dateNaissance?: string | null): number | null {
  if (!dateNaissance) return null;
  const birth = new Date(dateNaissance);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
}

export function PatientDossierInfoContent({ prescriptionId }: PatientDossierInfoContentProps) {
  const [prescription, setPrescription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDossierTab, setActiveDossierTab] = useState<DossierTabKey>("observation");
  const [examensComplementaires, setExamensComplementaires] = useState("");
  const [isSavingExamens, setIsSavingExamens] = useState(false);
  const [saveExamensStatus, setSaveExamensStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiJson<any>(`/api/prescriptions/${prescriptionId}`);
        if (!cancelled) {
          setPrescription(data);
          setExamensComplementaires(data?.examensComplementaires || "");
        }
      } catch (err) {
        if (!cancelled) setError("Impossible de charger ce dossier.");
        console.error("Erreur chargement dossier patient :", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [prescriptionId]);

  const handleSaveExamensComplementaires = async () => {
    if (!prescription?.id) return;
    setIsSavingExamens(true);
    setSaveExamensStatus("idle");
    try {
      await apiJson(`/api/prescriptions/${prescription.id}/examens-complementaires`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examensComplementaires }),
      });
      setSaveExamensStatus("success");
      setTimeout(() => setSaveExamensStatus("idle"), 2500);
    } catch (e) {
      console.error("Erreur enregistrement examens complémentaires :", e);
      setSaveExamensStatus("error");
    } finally {
      setIsSavingExamens(false);
    }
  };

  if (isLoading) {
    return (
      <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-8 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-surface-container rounded" />
        <div className="h-4 w-72 bg-surface-container rounded" />
      </section>
    );
  }

  if (error || !prescription) {
    return (
      <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-8 text-center text-on-surface-variant">
        {error || "Dossier introuvable."}
      </section>
    );
  }

  const patient = prescription.patient;
  const age = computeAge(patient?.dateNaissance);
  const sexeLabel = patient?.sexe === "F" ? "Femme" : patient?.sexe === "M" ? "Homme" : "—";
  const initiale = patient?.nom?.trim()?.[0]?.toUpperCase() || "?";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center text-lg font-extrabold shrink-0">
            {initiale}
          </div>
          <div className="min-w-0">
            <h1 className="font-headline text-lg font-extrabold tracking-tight truncate">
              {patient ? `${patient.nom} ${patient.prenom}` : "Patient inconnu"}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <PriseEnChargeBadge priseEnChargeId={patient?.priseEnChargeId} />
              <span className="inline-flex items-center rounded-full bg-surface-container px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant">
                Groupe : —
              </span>
              <span className="inline-flex items-center rounded-full bg-surface-container px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant">
                Âge / Sexe : {age != null ? `${age} ans` : "—"} / {sexeLabel}
              </span>
              <span className="inline-flex items-center rounded-full bg-surface-container px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant">
                Chambre : —
              </span>
            </div>
          </div>
        </div>
        {/* Même badge que les autres services CHU consommant ce dossier — rappelle que
            rien ici ne peut être modifié depuis Endoscopie (voir DossierPatientService). */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-700 px-3 py-1.5 text-xs font-bold uppercase tracking-wider shrink-0 self-start sm:self-center">
          <span className="material-symbols-outlined text-sm">lock</span>
          Lecture seule
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {DOSSIER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveDossierTab(tab.key)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeDossierTab === tab.key
                ? "bg-primary text-white shadow-sm"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {patient?.id && (
        <>
          {activeDossierTab === "observation" && <ObservationTab patientId={patient.id} patient={patient} />}
          {activeDossierTab === "diagnostic" && <DiagnosticTab patientId={patient.id} />}
          {activeDossierTab === "suivi" && <SuiviTab patientId={patient.id} />}
          {activeDossierTab === "parametres" && <ParametresTab patientId={patient.id} />}
          {activeDossierTab === "avis" && <AvisTab />}
          {activeDossierTab === "prescription" && <PrescriptionTab patientId={patient.id} />}
          {activeDossierTab === "compte-rendu-operatoire" && <CompteRenduOperatoireTab patientId={patient.id} />}
          {activeDossierTab === "resultats" && <ResultatsParacliniquesTab patientId={patient.id} />}
          {activeDossierTab === "sortie" && <SortieTab />}
          {activeDossierTab === "historique" && <HistoriqueTab patientId={patient.id} />}
        </>
      )}

      <section className="pt-2 border-t border-outline-variant/10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
          Demande d&apos;examens complémentaires
        </p>
        <p className="text-[11px] text-on-surface-variant mb-2">
          Propre à Endoscopie — à distinguer du dossier CHU ci-dessus, qui reste en lecture seule.
        </p>
        <textarea
          value={examensComplementaires}
          onChange={(e) => setExamensComplementaires(e.target.value)}
          placeholder="Ex. Bilan de coagulation, ECG, consultation cardiologique..."
          rows={3}
          className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none resize-none"
        />
        <div className="flex items-center justify-end gap-3 mt-2">
          {saveExamensStatus === "success" && (
            <span className="text-[11px] font-semibold text-success">Enregistré</span>
          )}
          {saveExamensStatus === "error" && (
            <span className="text-[11px] font-semibold text-error">Échec de l&apos;enregistrement</span>
          )}
          <button
            type="button"
            onClick={handleSaveExamensComplementaires}
            disabled={isSavingExamens}
            className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingExamens ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </section>
    </div>
  );
}
