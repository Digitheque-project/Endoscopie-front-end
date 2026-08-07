"use client";

import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { AccordionSection } from "./AccordionSection";

interface ParametresTabProps {
  patientId: string;
}

const initialForm = {
  temperature: "",
  ta: "",
  frequenceCardiaque: "",
  spo2: "",
  note: "",
};

export function ParametresTab({ patientId }: ParametresTabProps) {
  const [parametres, setParametres] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const load = () => {
    setIsLoading(true);
    apiJson<any[]>(`/api/dossier-patient/${encodeURIComponent(patientId)}/parametres`)
      .then((data) => setParametres(Array.isArray(data) ? data : []))
      .catch(() => setParametres([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    setForm(initialForm);
    setSaveSuccess(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const sorted = parametres
    ? [...parametres].sort((a, b) => new Date(b.mesureAt ?? b.createdAt ?? 0).getTime() - new Date(a.mesureAt ?? a.createdAt ?? 0).getTime())
    : [];

  const handleSave = async () => {
    const valeurs: Record<string, unknown> = {};
    if (form.temperature) valeurs.temperature = Number(form.temperature);
    if (form.ta) valeurs.ta = form.ta;
    if (form.frequenceCardiaque) valeurs.frequenceCardiaque = Number(form.frequenceCardiaque);
    if (form.spo2) valeurs.spo2 = Number(form.spo2);
    if (Object.keys(valeurs).length === 0) {
      setSaveError("Renseignez au moins une valeur.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      await apiJson(`/api/dossier-patient/${encodeURIComponent(patientId)}/parametres`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesureAt: new Date().toISOString(), valeurs, note: form.note || undefined }),
      });
      setForm(initialForm);
      setSaveSuccess(true);
      load();
    } catch (e) {
      console.error("Erreur création relevé de paramètres :", e);
      setSaveError("Échec de l'enregistrement du relevé.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-xs text-on-surface-variant">Chargement des paramètres…</p>;
  }

  return (
    <div className="space-y-3">
      <AccordionSection number="01" title="Nouveau relevé manuel" subtitle="Cliquez pour ouvrir" isComplete={false} defaultOpen>
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Température (°C)</label>
              <input type="number" value={form.temperature} onChange={(e) => setForm((p) => ({ ...p, temperature: e.target.value }))}
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">TA (ex. 120/80)</label>
              <input value={form.ta} onChange={(e) => setForm((p) => ({ ...p, ta: e.target.value }))} placeholder="130/80"
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">FC (bpm)</label>
              <input type="number" value={form.frequenceCardiaque} onChange={(e) => setForm((p) => ({ ...p, frequenceCardiaque: e.target.value }))}
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">SpO2 (%)</label>
              <input type="number" value={form.spo2} onChange={(e) => setForm((p) => ({ ...p, spo2: e.target.value }))}
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Note</label>
            <textarea value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              rows={2} className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none resize-none" />
          </div>
          {saveError && <p className="text-[11px] font-semibold text-error">{saveError}</p>}
          {saveSuccess && <p className="text-[11px] font-semibold text-success">Relevé enregistré.</p>}
          <div className="flex items-center justify-end">
            <button type="button" onClick={handleSave} disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50">
              {isSaving ? "Enregistrement…" : "Enregistrer le relevé"}
            </button>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection number="02" title="Historique des relevés" subtitle="Cliquez pour ouvrir" isComplete={false}>
        {sorted.length === 0 ? (
          <p className="text-xs text-on-surface-variant">Aucun paramètre relevé pour ce patient.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/20">
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 pr-2">Origine</th>
                  <th className="py-2 pr-2">Valeurs</th>
                  <th className="py-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, i) => (
                  <tr key={p.id ?? i} className="border-b border-outline-variant/10">
                    <td className="py-2 pr-2 whitespace-nowrap">
                      {p.mesureAt ? new Date(p.mesureAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—"}
                    </td>
                    <td className="py-2 pr-2 text-on-surface-variant">{p.origine === "RELEVE_MANUEL" ? "Manuel" : p.origine || "—"}</td>
                    <td className="py-2 pr-2">
                      {p.valeurs && typeof p.valeurs === "object" ? Object.entries(p.valeurs).map(([k, v]) => `${k}: ${v}`).join(" · ") : "—"}
                    </td>
                    <td className="py-2 text-on-surface-variant">{p.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AccordionSection>
    </div>
  );
}
