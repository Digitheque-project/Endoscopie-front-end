"use client";

import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { AccordionSection } from "./AccordionSection";

interface SuiviTabProps {
  patientId: string;
}

const initialForm = {
  temperature: "",
  taSystolique: "",
  taDiastolique: "",
  frequenceCardiaque: "",
  frequenceRespiratoire: "",
  evaDouleur: "",
  glasgow: "",
  etatGeneral: "",
  examenClinique: "",
  evolution: "",
  signesAlerte: false,
};

export function SuiviTab({ patientId }: SuiviTabProps) {
  const { role, medecinName } = useAuth();
  const [suivis, setSuivis] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const load = () => {
    setIsLoading(true);
    apiJson<any[]>(`/api/dossier-patient/${encodeURIComponent(patientId)}/suivis`)
      .then((data) => setSuivis(Array.isArray(data) ? data : []))
      .catch(() => setSuivis([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    setForm(initialForm);
    setSaveSuccess(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const sorted = suivis ? [...suivis].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()) : [];

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    const auteur = role === "MEDECIN" ? `Dr. ${medecinName}` : "Major";
    try {
      await apiJson(`/api/dossier-patient/${encodeURIComponent(patientId)}/suivis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jourHospitalisation: `J${(suivis?.length ?? 0) + 1}`,
          temperature: form.temperature ? Number(form.temperature) : undefined,
          taSystolique: form.taSystolique || undefined,
          taDiastolique: form.taDiastolique || undefined,
          frequenceCardiaque: form.frequenceCardiaque || undefined,
          frequenceRespiratoire: form.frequenceRespiratoire || undefined,
          evaDouleur: form.evaDouleur ? Number(form.evaDouleur) : undefined,
          glasgow: form.glasgow || undefined,
          etatGeneral: form.etatGeneral || undefined,
          examenClinique: form.examenClinique || undefined,
          evolution: form.evolution || undefined,
          signesAlerte: form.signesAlerte,
          auteur,
        }),
      });
      setForm(initialForm);
      setSaveSuccess(true);
      load();
    } catch (e) {
      console.error("Erreur création suivi :", e);
      setSaveError("Échec de l'enregistrement du suivi.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-xs text-on-surface-variant">Chargement des suivis…</p>;
  }

  return (
    <div className="space-y-3">
      <AccordionSection number="01" title="Nouveau suivi" subtitle="Cliquez pour ouvrir" isComplete={false} defaultOpen>
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Température (°C)</label>
              <input type="number" value={form.temperature} onChange={(e) => setForm((p) => ({ ...p, temperature: e.target.value }))}
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">TA systolique</label>
              <input value={form.taSystolique} onChange={(e) => setForm((p) => ({ ...p, taSystolique: e.target.value }))}
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">TA diastolique</label>
              <input value={form.taDiastolique} onChange={(e) => setForm((p) => ({ ...p, taDiastolique: e.target.value }))}
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">FC (bpm)</label>
              <input value={form.frequenceCardiaque} onChange={(e) => setForm((p) => ({ ...p, frequenceCardiaque: e.target.value }))}
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">FR (m/m)</label>
              <input value={form.frequenceRespiratoire} onChange={(e) => setForm((p) => ({ ...p, frequenceRespiratoire: e.target.value }))}
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">EVA douleur (0-10)</label>
              <input type="number" min={0} max={10} value={form.evaDouleur} onChange={(e) => setForm((p) => ({ ...p, evaDouleur: e.target.value }))}
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Glasgow</label>
              <input value={form.glasgow} onChange={(e) => setForm((p) => ({ ...p, glasgow: e.target.value }))}
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">État général</label>
              <input value={form.etatGeneral} onChange={(e) => setForm((p) => ({ ...p, etatGeneral: e.target.value }))} placeholder="Stable"
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Examen clinique</label>
            <textarea value={form.examenClinique} onChange={(e) => setForm((p) => ({ ...p, examenClinique: e.target.value }))}
              rows={2} className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none resize-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Évolution / commentaires</label>
            <textarea value={form.evolution} onChange={(e) => setForm((p) => ({ ...p, evolution: e.target.value }))}
              rows={2} className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none resize-none" />
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-error cursor-pointer">
            <input type="checkbox" checked={form.signesAlerte} onChange={(e) => setForm((p) => ({ ...p, signesAlerte: e.target.checked }))}
              className="h-4 w-4 rounded border-outline-variant/50 text-error focus:ring-error/30" />
            Signes d&apos;alerte détectés
          </label>
          {saveError && <p className="text-[11px] font-semibold text-error">{saveError}</p>}
          {saveSuccess && <p className="text-[11px] font-semibold text-success">Suivi enregistré.</p>}
          <div className="flex items-center justify-end">
            <button type="button" onClick={handleSave} disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50">
              {isSaving ? "Enregistrement…" : "Enregistrer le suivi"}
            </button>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection number="02" title="Historique des suivis" subtitle="Cliquez pour ouvrir" isComplete={false}>
        {sorted.length === 0 ? (
          <p className="text-xs text-on-surface-variant">Aucun suivi enregistré pour ce patient.</p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((s, i) => (
              <li key={s.id ?? i} className={`rounded-lg border p-3 text-xs ${s.signesAlerte ? "border-error/40 bg-error-container/10" : "border-outline-variant/20"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-on-surface">{s.jourHospitalisation || `Suivi ${i + 1}`} — {s.auteur || "Auteur inconnu"}</span>
                  <span className="text-on-surface-variant">{s.createdAt ? new Date(s.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : ""}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-on-surface-variant">
                  {s.temperature != null && <span>Temp : {s.temperature}°C</span>}
                  {(s.taSystolique || s.taDiastolique) && <span>TA : {s.taSystolique ?? "?"}/{s.taDiastolique ?? "?"}</span>}
                  {s.frequenceCardiaque && <span>FC : {s.frequenceCardiaque}</span>}
                  {s.evaDouleur != null && <span>EVA : {s.evaDouleur}/10</span>}
                  {s.etatGeneral && <span>État : {s.etatGeneral}</span>}
                </div>
                {s.evolution && <p className="mt-1 text-on-surface-variant">{s.evolution}</p>}
                {s.signesAlerte && (
                  <p className="mt-1 font-bold text-error flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    Signes d&apos;alerte
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </AccordionSection>
    </div>
  );
}
