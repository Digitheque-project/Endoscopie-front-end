"use client";

import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { AccordionSection } from "./AccordionSection";

interface DiagnosticTabProps {
  patientId: string;
}

const initialForm = {
  icdCode: "",
  icdLabel: "",
  type: "SUSPICION" as "SUSPICION" | "RETENU",
  isPrimary: true,
  diagnosticPrincipal: "",
  diagnosticSecondaire: "",
  justification: "",
};

function pickActive(diagnostics: any[]): any | null {
  if (diagnostics.length === 0) return null;
  const sorted = [...diagnostics].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
  return sorted.find((d) => d.isActive) || sorted.find((d) => d.type === "RETENU" && d.isPrimary) || sorted.find((d) => d.isPrimary) || sorted[0];
}

export function DiagnosticTab({ patientId }: DiagnosticTabProps) {
  const { role, medecinName } = useAuth();
  const [diagnostics, setDiagnostics] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const load = () => {
    setIsLoading(true);
    apiJson<any[]>(`/api/dossier-patient/${encodeURIComponent(patientId)}/diagnostics`)
      .then((data) => setDiagnostics(Array.isArray(data) ? data : []))
      .catch(() => setDiagnostics([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    setForm(initialForm);
    setSaveSuccess(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const active = diagnostics ? pickActive(diagnostics) : null;

  const handleSave = async () => {
    if (!form.icdLabel.trim() && !form.diagnosticPrincipal.trim()) {
      setSaveError("Renseignez au moins un libellé ou un diagnostic principal.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      await apiJson(`/api/dossier-patient/${encodeURIComponent(patientId)}/diagnostics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, createdBy: role === "MEDECIN" ? medecinName : role }),
      });
      setForm(initialForm);
      setSaveSuccess(true);
      load();
    } catch (e) {
      console.error("Erreur création diagnostic :", e);
      setSaveError("Échec de l'enregistrement du diagnostic.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-xs text-on-surface-variant">Chargement des diagnostics…</p>;
  }

  return (
    <div className="space-y-3">
      <AccordionSection number="01" title="Diagnostic actuel" subtitle="Cliquez pour ouvrir" isComplete={!!active} defaultOpen>
        {active ? (
          <div className="space-y-1.5 text-sm">
            <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${active.type === "RETENU" ? "bg-success-container text-success" : "bg-amber-100 text-amber-700"}`}>
              {active.type === "RETENU" ? "Retenu" : "Suspicion"}
            </span>
            {active.icdCode && <p className="font-bold text-on-surface">{active.icdCode} — {active.icdLabel || "Sans libellé"}</p>}
            {active.diagnosticPrincipal && <p><strong>Diagnostic principal :</strong> {active.diagnosticPrincipal}</p>}
            {active.diagnosticSecondaire && <p className="text-on-surface-variant"><strong>Diagnostic secondaire :</strong> {active.diagnosticSecondaire}</p>}
            {active.justification && <p className="text-on-surface-variant"><strong>Justification :</strong> {active.justification}</p>}
          </div>
        ) : (
          <p className="text-xs text-on-surface-variant">Aucun diagnostic enregistré pour ce patient.</p>
        )}
      </AccordionSection>

      <AccordionSection number="02" title="Nouveau diagnostic" subtitle="Cliquez pour ouvrir" isComplete={false}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Code CIM-10</label>
              <input value={form.icdCode} onChange={(e) => setForm((p) => ({ ...p, icdCode: e.target.value }))} placeholder="J21.0"
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Libellé CIM-10</label>
              <input value={form.icdLabel} onChange={(e) => setForm((p) => ({ ...p, icdLabel: e.target.value }))} placeholder="Bronchiolite aiguë"
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Type</label>
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as "SUSPICION" | "RETENU" }))}
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none">
                <option value="SUSPICION">Suspicion</option>
                <option value="RETENU">Retenu</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer mt-5">
              <input type="checkbox" checked={form.isPrimary} onChange={(e) => setForm((p) => ({ ...p, isPrimary: e.target.checked }))}
                className="h-4 w-4 rounded border-outline-variant/50 text-primary focus:ring-primary/30" />
              Diagnostic principal
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Diagnostic principal (texte libre)</label>
            <input value={form.diagnosticPrincipal} onChange={(e) => setForm((p) => ({ ...p, diagnosticPrincipal: e.target.value }))}
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Diagnostic secondaire</label>
            <input value={form.diagnosticSecondaire} onChange={(e) => setForm((p) => ({ ...p, diagnosticSecondaire: e.target.value }))}
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Justification clinique</label>
            <textarea value={form.justification} onChange={(e) => setForm((p) => ({ ...p, justification: e.target.value }))}
              rows={2} className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none resize-none" />
          </div>
          {saveError && <p className="text-[11px] font-semibold text-error">{saveError}</p>}
          {saveSuccess && <p className="text-[11px] font-semibold text-success">Diagnostic enregistré.</p>}
          <div className="flex items-center justify-end">
            <button type="button" onClick={handleSave} disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50">
              {isSaving ? "Enregistrement…" : "Enregistrer le diagnostic"}
            </button>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection number="03" title="Historique des diagnostics" subtitle="Cliquez pour ouvrir" isComplete={false}>
        {diagnostics && diagnostics.length > 0 ? (
          <ul className="space-y-2">
            {diagnostics.map((d, i) => (
              <li key={d.id ?? i} className="rounded-lg border border-outline-variant/20 p-3 text-xs text-on-surface-variant">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-on-surface">{d.icdLabel || d.diagnosticPrincipal || "Diagnostic"}</span>
                  <span>{d.createdAt ? new Date(d.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : ""}</span>
                </div>
                {d.justification && <p>{d.justification}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-on-surface-variant">Aucun historique de diagnostic.</p>
        )}
      </AccordionSection>
    </div>
  );
}
