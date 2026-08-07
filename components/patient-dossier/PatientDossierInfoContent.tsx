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

interface PatientDossierInfoContentProps {
  prescriptionId: string;
}

const DOSSIER_TABS = [
  { key: "observation", label: "Observation médicale", icon: "stethoscope" },
  { key: "diagnostic", label: "Diagnostic", icon: "monitor_heart" },
  { key: "suivi", label: "Suivi / Évolution", icon: "timeline" },
  { key: "parametres", label: "Paramètres", icon: "speed" },
  { key: "historique", label: "Historique", icon: "history" },
  { key: "resultats", label: "Résultats paracliniques", icon: "biotech" },
] as const;
type DossierTabKey = (typeof DOSSIER_TABS)[number]["key"];

export function PatientDossierInfoContent({ prescriptionId }: PatientDossierInfoContentProps) {
  const [prescription, setPrescription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDossierTab, setActiveDossierTab] = useState<DossierTabKey>("observation");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiJson<any>(`/api/prescriptions/${prescriptionId}`);
        if (!cancelled) setPrescription(data);
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined text-2xl">contact_page</span>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Dossier patient</p>
          <h1 className="font-headline text-xl font-extrabold tracking-tight">
            {patient ? `${patient.nom} ${patient.prenom}` : "Patient inconnu"}
          </h1>
          <PriseEnChargeBadge priseEnChargeId={patient?.priseEnChargeId} className="mt-1" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {DOSSIER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveDossierTab(tab.key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
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
          {activeDossierTab === "historique" && <HistoriqueTab patientId={patient.id} />}
          {activeDossierTab === "resultats" && <ResultatsParacliniquesTab patientId={patient.id} />}
        </>
      )}
    </div>
  );
}
