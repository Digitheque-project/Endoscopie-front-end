"use client";

import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
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

const OBSERVATION_TYPES = [
  { value: "GENERAL", label: "Général" },
  { value: "PEDIATRIQUE", label: "Pédiatrique" },
  { value: "NEONATAL", label: "Néonatal" },
];

const URGENCY_LEVELS = [
  { value: "1", label: "Niveau 1 — Menace vitale" },
  { value: "2", label: "Niveau 2 — Urgent" },
  { value: "3", label: "Niveau 3 — Semi-urgent" },
  { value: "4", label: "Niveau 4 — Non urgent" },
];

const initialForm = {
  observationType: "GENERAL",
  urgencyLevel: "",
  symptoms: "",
  medicalHistory: "",
  currentTreatments: "",
  physicalExamination: "",
  clinicalImpressions: "",
  complementaryExams: "",
  systolicBP: "",
  diastolicBP: "",
  heartRate: "",
  temperature: "",
  respiratoryRate: "",
  oxygenSaturation: "",
  weight: "",
  height: "",
};

function computeAge(dateNaissance?: string | null): number | null {
  if (!dateNaissance) return null;
  const birth = new Date(dateNaissance);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
}

function TextArea({ value, onChange, placeholder, rows = 2 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none resize-none"
    />
  );
}

function NumberField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none"
      />
    </div>
  );
}

export function ObservationTab({ patientId, patient }: ObservationTabProps) {
  const { role, medecinName } = useAuth();
  const [observations, setObservations] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<"form" | "history">("form");
  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const load = () => {
    setIsLoading(true);
    apiJson<any[]>(`/api/dossier-patient/${encodeURIComponent(patientId)}/observations`)
      .then((data) => setObservations(Array.isArray(data) ? data : []))
      .catch(() => setObservations([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    setView("form");
    setForm(initialForm);
    setSaveSuccess(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const update = (key: keyof typeof initialForm) => (v: string) => {
    setForm((prev) => ({ ...prev, [key]: v }));
    setSaveSuccess(false);
  };

  const age = computeAge(patient?.dateNaissance);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    const numericFields = ["systolicBP", "diastolicBP", "heartRate", "temperature", "respiratoryRate", "oxygenSaturation", "weight", "height"] as const;
    const textFields = ["symptoms", "medicalHistory", "currentTreatments", "physicalExamination", "clinicalImpressions", "complementaryExams"] as const;
    const payload: Record<string, unknown> = { observationType: form.observationType };
    if (form.urgencyLevel) payload.urgencyLevel = Number(form.urgencyLevel);
    for (const key of numericFields) if (form[key]) payload[key] = Number(form[key]);
    for (const key of textFields) if (form[key]) payload[key] = form[key];
    payload.createdBy = role === "MEDECIN" ? medecinName : role;
    try {
      await apiJson(`/api/dossier-patient/${encodeURIComponent(patientId)}/observations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSaveSuccess(true);
      load();
    } catch (e) {
      console.error("Erreur création observation :", e);
      setSaveError("Échec de l'enregistrement de l'observation.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-xs text-on-surface-variant">Chargement des observations…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setView("form")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
            view === "form" ? "bg-primary text-white shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">edit_note</span>
          Observation en cours
        </button>
        <button
          type="button"
          onClick={() => setView("history")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
            view === "history" ? "bg-primary text-white shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">history</span>
          Historique des observations{observations && observations.length > 0 ? ` (${observations.length})` : ""}
        </button>
      </div>

      {view === "history" ? (
        observations && observations.length > 0 ? (
          <ul className="space-y-2">
            {observations.map((o, i) => (
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
          <AccordionSection number="01" title="Identification du patient" subtitle="Cliquez pour ouvrir" isComplete defaultOpen={false}>
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

          <AccordionSection number="02" title="Motif / Symptômes" subtitle="Cliquez pour ouvrir" isComplete={!!form.symptoms} defaultOpen>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Type d&apos;observation</label>
                <select value={form.observationType} onChange={(e) => update("observationType")(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none">
                  {OBSERVATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Degré d&apos;urgence</label>
                <select value={form.urgencyLevel} onChange={(e) => update("urgencyLevel")(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none">
                  <option value="">— Non renseigné</option>
                  {URGENCY_LEVELS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
            </div>
            <TextArea value={form.symptoms} onChange={update("symptoms")} placeholder="Ex. douleurs épigastriques depuis 3 mois..." />
          </AccordionSection>

          <AccordionSection number="03" title="Antécédents médicaux" subtitle="Cliquez pour ouvrir" isComplete={!!form.medicalHistory}>
            <TextArea value={form.medicalHistory} onChange={update("medicalHistory")} placeholder="Hypertension, diabète type 2..." />
          </AccordionSection>

          <AccordionSection number="04" title="Traitements en cours" subtitle="Cliquez pour ouvrir" isComplete={!!form.currentTreatments}>
            <TextArea value={form.currentTreatments} onChange={update("currentTreatments")} placeholder="Liste des traitements en cours..." />
          </AccordionSection>

          <AccordionSection number="05" title="Examen physique" subtitle="Cliquez pour ouvrir" isComplete={!!form.physicalExamination}>
            <TextArea value={form.physicalExamination} onChange={update("physicalExamination")} placeholder="Bruits cardiaques normaux, poumons clairs..." />
          </AccordionSection>

          <AccordionSection number="06" title="État général / Impressions cliniques" subtitle="Cliquez pour ouvrir" isComplete={!!form.clinicalImpressions}>
            <TextArea value={form.clinicalImpressions} onChange={update("clinicalImpressions")} placeholder="État stable, surveiller la tension artérielle..." />
          </AccordionSection>

          <AccordionSection number="07" title="Examens complémentaires" subtitle="Cliquez pour ouvrir" isComplete={!!form.complementaryExams}>
            <TextArea value={form.complementaryExams} onChange={update("complementaryExams")} placeholder="Bilan sanguin, imagerie demandée..." />
          </AccordionSection>

          <AccordionSection
            number="08"
            title="Constantes vitales"
            subtitle="Cliquez pour ouvrir"
            isComplete={[form.systolicBP, form.heartRate, form.temperature].some(Boolean)}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <NumberField label="TA systolique" value={form.systolicBP} onChange={update("systolicBP")} placeholder="120" />
              <NumberField label="TA diastolique" value={form.diastolicBP} onChange={update("diastolicBP")} placeholder="80" />
              <NumberField label="FC (bpm)" value={form.heartRate} onChange={update("heartRate")} placeholder="72" />
              <NumberField label="Température (°C)" value={form.temperature} onChange={update("temperature")} placeholder="36.5" />
              <NumberField label="FR (m/m)" value={form.respiratoryRate} onChange={update("respiratoryRate")} placeholder="16" />
              <NumberField label="SpO2 (%)" value={form.oxygenSaturation} onChange={update("oxygenSaturation")} placeholder="98" />
              <NumberField label="Poids (kg)" value={form.weight} onChange={update("weight")} placeholder="70" />
              <NumberField label="Taille (cm)" value={form.height} onChange={update("height")} placeholder="170" />
            </div>
          </AccordionSection>

          {saveError && <p className="text-[11px] font-semibold text-error">{saveError}</p>}
          {saveSuccess && <p className="text-[11px] font-semibold text-success">Observation enregistrée.</p>}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isSaving ? "Enregistrement…" : "Enregistrer l'observation"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
