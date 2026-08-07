"use client";

import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface DiagnosticTabProps {
  patientId: string;
}

const initialForm = {
  icdCode: "",
  icdLabel: "",
  type: "SUSPICION" as "SUSPICION" | "RETENU",
  isPrimary: true,
  diagnosticPrincipal: "",
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
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = () => {
    setIsLoading(true);
    apiJson<any[]>(`/api/dossier-patient/${encodeURIComponent(patientId)}/diagnostics`)
      .then((data) => setDiagnostics(Array.isArray(data) ? data : []))
      .catch(() => setDiagnostics([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    setShowForm(false);
    setShowHistory(false);
    setForm(initialForm);
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
        body: JSON.stringify({
          ...form,
          createdBy: role === "MEDECIN" ? medecinName : role,
        }),
      });
      setForm(initialForm);
      setShowForm(false);
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
    <div className="space-y-4">
      {active && !showForm && (
        <div className="rounded-xl border border-outline-variant/20 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Diagnostic actuel</p>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${active.type === "RETENU" ? "bg-success-container text-success" : "bg-amber-100 text-amber-700"}`}>
              {active.type === "RETENU" ? "Retenu" : "Suspicion"}
            </span>
          </div>
          {active.icdCode && (
            <p className="text-sm font-bold text-on-surface">
              {active.icdCode} — {active.icdLabel || "Sans libellé"}
            </p>
          )}
          {active.diagnosticPrincipal && (
            <p className="text-sm text-on-surface"><strong>Diagnostic principal :</strong> {active.diagnosticPrincipal}</p>
          )}
          {active.diagnosticSecondaire && (
            <p className="text-xs text-on-surface-variant"><strong>Diagnostic secondaire :</strong> {active.diagnosticSecondaire}</p>
          )}
          {active.justification && (
            <p className="text-xs text-on-surface-variant"><strong>Justification :</strong> {active.justification}</p>
          )}
        </div>
      )}

      {!active && !showForm && (
        <p className="text-xs text-on-surface-variant">Aucun diagnostic enregistré pour ce patient.</p>
      )}

      {showForm ? (
        <div className="rounded-xl border border-outline-variant/20 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Code CIM-10</label>
              <input
                value={form.icdCode}
                onChange={(e) => setForm((p) => ({ ...p, icdCode: e.target.value }))}
                placeholder="J21.0"
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Libellé CIM-10</label>
              <input
                value={form.icdLabel}
                onChange={(e) => setForm((p) => ({ ...p, icdLabel: e.target.value }))}
                placeholder="Bronchiolite aiguë"
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as "SUSPICION" | "RETENU" }))}
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none"
              >
                <option value="SUSPICION">Suspicion</option>
                <option value="RETENU">Retenu</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer mt-5">
              <input
                type="checkbox"
                checked={form.isPrimary}
                onChange={(e) => setForm((p) => ({ ...p, isPrimary: e.target.checked }))}
                className="h-4 w-4 rounded border-outline-variant/50 text-primary focus:ring-primary/30"
              />
              Diagnostic principal
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Diagnostic principal (texte libre)</label>
            <input
              value={form.diagnosticPrincipal}
              onChange={(e) => setForm((p) => ({ ...p, diagnosticPrincipal: e.target.value }))}
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Justification clinique</label>
            <textarea
              value={form.justification}
              onChange={(e) => setForm((p) => ({ ...p, justification: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm outline-none resize-none"
            />
          </div>
          {saveError && <p className="text-[11px] font-semibold text-error">{saveError}</p>}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(initialForm); setSaveError(null); }}
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
            Nouveau diagnostic
          </button>
          {diagnostics && diagnostics.length > 1 && (
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-outline-variant/30 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              {showHistory ? "Masquer l'historique" : `Historique (${diagnostics.length})`}
            </button>
          )}
        </div>
      )}

      {showHistory && diagnostics && (
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
      )}
    </div>
  );
}
