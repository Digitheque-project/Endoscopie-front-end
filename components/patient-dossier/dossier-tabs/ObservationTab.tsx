"use client";

import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface ObservationTabProps {
  patientId: string;
}

const OBSERVATION_TYPES = [
  { value: "GENERAL", label: "Général" },
  { value: "PEDIATRIQUE", label: "Pédiatrique" },
  { value: "NEONATAL", label: "Néonatal" },
];

const initialForm = {
  observationType: "GENERAL",
  systolicBP: "",
  diastolicBP: "",
  heartRate: "",
  temperature: "",
  respiratoryRate: "",
  oxygenSaturation: "",
  weight: "",
  height: "",
  symptoms: "",
  medicalHistory: "",
  physicalExamination: "",
  clinicalImpressions: "",
};

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none"
      />
    </div>
  );
}

export function ObservationTab({ patientId }: ObservationTabProps) {
  const { role, medecinName } = useAuth();
  const [observations, setObservations] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = () => {
    setIsLoading(true);
    apiJson<any[]>(`/api/dossier-patient/${encodeURIComponent(patientId)}/observations`)
      .then((data) => setObservations(Array.isArray(data) ? data : []))
      .catch(() => setObservations([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    setShowForm(false);
    setShowHistory(false);
    setForm(initialForm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const latest = observations && observations.length > 0
    ? [...observations].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())[0]
    : null;

  const updateField = (key: keyof typeof initialForm) => (v: string) => setForm((prev) => ({ ...prev, [key]: v }));

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    const numericFields = ["systolicBP", "diastolicBP", "heartRate", "temperature", "respiratoryRate", "oxygenSaturation", "weight", "height"] as const;
    const payload: Record<string, unknown> = { observationType: form.observationType };
    for (const key of numericFields) {
      if (form[key]) payload[key] = Number(form[key]);
    }
    for (const key of ["symptoms", "medicalHistory", "physicalExamination", "clinicalImpressions"] as const) {
      if (form[key]) payload[key] = form[key];
    }
    payload.createdBy = role === "MEDECIN" ? medecinName : role;
    try {
      await apiJson(`/api/dossier-patient/${encodeURIComponent(patientId)}/observations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setForm(initialForm);
      setShowForm(false);
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
      {latest && !showForm && (
        <div className="rounded-xl border border-outline-variant/20 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Dernière observation</p>
            <span className="text-[10px] font-bold text-on-surface-variant">
              {latest.createdAt ? new Date(latest.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : ""}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {latest.temperature != null && <span>Température : <strong>{latest.temperature}°C</strong></span>}
            {latest.heartRate != null && <span>FC : <strong>{latest.heartRate} bpm</strong></span>}
            {(latest.systolicBP != null || latest.diastolicBP != null) && (
              <span>TA : <strong>{latest.systolicBP ?? "?"}/{latest.diastolicBP ?? "?"}</strong></span>
            )}
            {latest.oxygenSaturation != null && <span>SpO2 : <strong>{latest.oxygenSaturation}%</strong></span>}
          </div>
          {latest.symptoms && <p className="text-xs text-on-surface-variant"><strong>Symptômes :</strong> {latest.symptoms}</p>}
          {latest.clinicalImpressions && <p className="text-xs text-on-surface-variant"><strong>Impressions cliniques :</strong> {latest.clinicalImpressions}</p>}
        </div>
      )}

      {!latest && !showForm && (
        <p className="text-xs text-on-surface-variant">Aucune observation enregistrée pour ce patient.</p>
      )}

      {showForm ? (
        <div className="rounded-xl border border-outline-variant/20 p-4 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Type d&apos;observation</label>
            <select
              value={form.observationType}
              onChange={(e) => updateField("observationType")(e.target.value)}
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none"
            >
              {OBSERVATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="TA systolique" value={form.systolicBP} onChange={updateField("systolicBP")} type="number" placeholder="120" />
            <Field label="TA diastolique" value={form.diastolicBP} onChange={updateField("diastolicBP")} type="number" placeholder="80" />
            <Field label="FC (bpm)" value={form.heartRate} onChange={updateField("heartRate")} type="number" placeholder="72" />
            <Field label="Température (°C)" value={form.temperature} onChange={updateField("temperature")} type="number" placeholder="36.5" />
            <Field label="FR (m/m)" value={form.respiratoryRate} onChange={updateField("respiratoryRate")} type="number" placeholder="16" />
            <Field label="SpO2 (%)" value={form.oxygenSaturation} onChange={updateField("oxygenSaturation")} type="number" placeholder="98" />
            <Field label="Poids (kg)" value={form.weight} onChange={updateField("weight")} type="number" placeholder="70" />
            <Field label="Taille (cm)" value={form.height} onChange={updateField("height")} type="number" placeholder="170" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Symptômes</label>
            <textarea
              value={form.symptoms}
              onChange={(e) => updateField("symptoms")(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Antécédents médicaux</label>
            <textarea
              value={form.medicalHistory}
              onChange={(e) => updateField("medicalHistory")(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Examen physique</label>
            <textarea
              value={form.physicalExamination}
              onChange={(e) => updateField("physicalExamination")(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Impressions cliniques</label>
            <textarea
              value={form.clinicalImpressions}
              onChange={(e) => updateField("clinicalImpressions")(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none resize-none"
            />
          </div>
          {saveError && <p className="text-[11px] font-semibold text-error">{saveError}</p>}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(initialForm); }}
              className="px-4 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-all"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isSaving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Nouvelle observation
          </button>
          {observations && observations.length > 1 && (
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-outline-variant/30 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              {showHistory ? "Masquer l'historique" : `Historique (${observations.length})`}
            </button>
          )}
        </div>
      )}

      {showHistory && observations && (
        <ul className="space-y-2">
          {observations.map((o, i) => (
            <li key={o.id ?? i} className="rounded-lg border border-outline-variant/20 p-3 text-xs text-on-surface-variant">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-on-surface">{o.observationType || "Observation"}</span>
                <span>{o.createdAt ? new Date(o.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : ""}</span>
              </div>
              {o.symptoms && <p>{o.symptoms}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
