"use client";

import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { PriseEnChargeBadge } from "@/components/patient/PriseEnChargeBadge";
import { AccordionSection } from "./AccordionSection";

interface PatientInfo {
  nom?: string;
  prenom?: string;
  dateNaissance?: string;
  sexe?: string;
  cin?: string;
  profession?: string;
  adresse?: string;
  telephone?: string;
  contactUrgence?: string;
  priseEnChargeId?: string | null;
}

interface ObservationTabProps {
  patientId: string;
  patient?: PatientInfo | null;
}

const URGENCY_LABELS: Record<number, string> = {
  1: "Niveau 1 — Menace vitale",
  2: "Niveau 2 — Urgent",
  3: "Niveau 3 — Semi-urgent",
  4: "Niveau 4 — Non urgent",
};

function computeAge(dateNaissance?: string | null): number | null {
  if (!dateNaissance) return null;
  const birth = new Date(dateNaissance);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === "") return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">{label}</p>
      <p className="text-sm text-on-surface whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export function ObservationTab({ patientId, patient }: ObservationTabProps) {
  const [observations, setObservations] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [view, setView] = useState<"latest" | "history">("latest");

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    apiJson<any[]>(`/api/dossier-patient/${encodeURIComponent(patientId)}/observations`)
      .then((data) => setObservations(Array.isArray(data) ? data : []))
      .catch(() => {
        setHasError(true);
        setObservations([]);
      })
      .finally(() => setIsLoading(false));
    setView("latest");
  }, [patientId]);

  const age = computeAge(patient?.dateNaissance);
  const sorted = observations ? [...observations].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()) : [];
  const latest = sorted[0] ?? null;

  if (isLoading) {
    return <p className="text-xs text-on-surface-variant">Chargement des observations…</p>;
  }

  return (
    <div className="space-y-4">
      {hasError && (
        <p className="rounded-lg border border-error/20 bg-error-container/10 px-3 py-2 text-xs text-error">
          Impossible de contacter le service Dossier Patient CHU pour l&apos;instant — réessayez plus tard.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setView("latest")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
            view === "latest" ? "bg-primary text-white shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">visibility</span>
          Dernière observation
        </button>
        <button
          type="button"
          onClick={() => setView("history")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
            view === "history" ? "bg-primary text-white shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">history</span>
          Historique{sorted.length > 0 ? ` (${sorted.length})` : ""}
        </button>
      </div>

      {view === "history" ? (
        sorted.length > 0 ? (
          <ul className="space-y-2">
            {sorted.map((o, i) => (
              <li key={o.id ?? i} className="rounded-lg border border-outline-variant/20 p-3 text-xs text-on-surface-variant">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-on-surface">{o.observationType || "Observation"}</span>
                  <span>{o.createdAt ? new Date(o.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : ""}</span>
                </div>
                {o.symptoms && <p><strong>Symptômes :</strong> {o.symptoms}</p>}
                {o.clinicalImpressions && <p><strong>Impressions :</strong> {o.clinicalImpressions}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-on-surface-variant">Aucune observation enregistrée pour ce patient.</p>
        )
      ) : (
        <div className="space-y-3">
          <AccordionSection number="01" title="Identification du patient" subtitle="Cliquez pour ouvrir" isComplete defaultOpen>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <p><span className="text-on-surface-variant">Nom :</span> <strong>{patient?.nom} {patient?.prenom}</strong></p>
              <p><span className="text-on-surface-variant">Âge / Sexe :</span> <strong>{age != null ? `${age} ans` : "—"} / {patient?.sexe === "F" ? "Féminin" : patient?.sexe === "M" ? "Masculin" : "—"}</strong></p>
              <p><span className="text-on-surface-variant">CIN :</span> <strong>{patient?.cin || "—"}</strong></p>
              <p><span className="text-on-surface-variant">Profession :</span> <strong>{patient?.profession || "—"}</strong></p>
              <p><span className="text-on-surface-variant">Téléphone :</span> <strong>{patient?.telephone || "—"}</strong></p>
              <p><span className="text-on-surface-variant">Contact d&apos;urgence :</span> <strong>{patient?.contactUrgence || "—"}</strong></p>
              <p className="sm:col-span-2"><span className="text-on-surface-variant">Adresse :</span> <strong>{patient?.adresse || "—"}</strong></p>
            </div>
            <PriseEnChargeBadge priseEnChargeId={patient?.priseEnChargeId} className="mt-1" />
          </AccordionSection>

          {!latest ? (
            <p className="text-xs text-on-surface-variant">Aucune observation enregistrée pour ce patient.</p>
          ) : (
            <>
              <AccordionSection number="02" title="Motif / Symptômes" subtitle="Cliquez pour ouvrir" isComplete={!!latest.symptoms} defaultOpen>
                <Field label="Type d'observation" value={latest.observationType} />
                <Field label="Degré d'urgence" value={latest.urgencyLevel ? URGENCY_LABELS[latest.urgencyLevel] : null} />
                <Field label="Symptômes" value={latest.symptoms} />
              </AccordionSection>
              <AccordionSection number="03" title="Antécédents médicaux" subtitle="Cliquez pour ouvrir" isComplete={!!latest.medicalHistory}>
                <Field label="Antécédents" value={latest.medicalHistory} />
              </AccordionSection>
              <AccordionSection number="04" title="Traitements en cours" subtitle="Cliquez pour ouvrir" isComplete={!!latest.currentTreatments}>
                <Field label="Traitements" value={latest.currentTreatments} />
              </AccordionSection>
              <AccordionSection number="05" title="Examen physique" subtitle="Cliquez pour ouvrir" isComplete={!!latest.physicalExamination}>
                <Field label="Examen physique" value={latest.physicalExamination} />
              </AccordionSection>
              <AccordionSection number="06" title="État général / Impressions cliniques" subtitle="Cliquez pour ouvrir" isComplete={!!latest.clinicalImpressions}>
                <Field label="Impressions cliniques" value={latest.clinicalImpressions} />
              </AccordionSection>
              <AccordionSection number="07" title="Examens complémentaires" subtitle="Cliquez pour ouvrir" isComplete={!!latest.complementaryExams}>
                <Field label="Examens complémentaires" value={latest.complementaryExams} />
              </AccordionSection>
              <AccordionSection
                number="08"
                title="Constantes vitales"
                subtitle="Cliquez pour ouvrir"
                isComplete={[latest.systolicBP, latest.heartRate, latest.temperature].some((v) => v != null)}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  {latest.systolicBP != null && <p><span className="text-on-surface-variant">TA :</span> <strong>{latest.systolicBP}/{latest.diastolicBP ?? "?"}</strong></p>}
                  {latest.heartRate != null && <p><span className="text-on-surface-variant">FC :</span> <strong>{latest.heartRate} bpm</strong></p>}
                  {latest.temperature != null && <p><span className="text-on-surface-variant">Temp :</span> <strong>{latest.temperature}°C</strong></p>}
                  {latest.respiratoryRate != null && <p><span className="text-on-surface-variant">FR :</span> <strong>{latest.respiratoryRate} m/m</strong></p>}
                  {latest.oxygenSaturation != null && <p><span className="text-on-surface-variant">SpO2 :</span> <strong>{latest.oxygenSaturation}%</strong></p>}
                  {latest.weight != null && <p><span className="text-on-surface-variant">Poids :</span> <strong>{latest.weight} kg</strong></p>}
                  {latest.height != null && <p><span className="text-on-surface-variant">Taille :</span> <strong>{latest.height} cm</strong></p>}
                </div>
              </AccordionSection>
            </>
          )}
        </div>
      )}
    </div>
  );
}
