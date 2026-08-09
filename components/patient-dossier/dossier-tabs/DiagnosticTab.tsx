"use client";

import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { AccordionSection } from "./AccordionSection";

interface DiagnosticTabProps {
  patientId: string;
}

function pickActive(diagnostics: any[]): any | null {
  if (diagnostics.length === 0) return null;
  const sorted = [...diagnostics].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
  return sorted.find((d) => d.isActive) || sorted.find((d) => d.type === "RETENU" && d.isPrimary) || sorted.find((d) => d.isPrimary) || sorted[0];
}

export function DiagnosticTab({ patientId }: DiagnosticTabProps) {
  const [diagnostics, setDiagnostics] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    apiJson<any[]>(`/api/dossier-patient/${encodeURIComponent(patientId)}/diagnostics`)
      .then((data) => setDiagnostics(Array.isArray(data) ? data : []))
      .catch(() => {
        setHasError(true);
        setDiagnostics([]);
      })
      .finally(() => setIsLoading(false));
  }, [patientId]);

  const active = diagnostics ? pickActive(diagnostics) : null;

  if (isLoading) {
    return <p className="text-xs text-on-surface-variant">Chargement des diagnostics…</p>;
  }

  return (
    <div className="space-y-3">
      {hasError && (
        <p className="rounded-lg border border-error/20 bg-error-container/10 px-3 py-2 text-xs text-error">
          Impossible de contacter le service Dossier Patient CHU pour l&apos;instant — réessayez plus tard.
        </p>
      )}
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

      <AccordionSection number="02" title="Historique des diagnostics" subtitle="Cliquez pour ouvrir" isComplete={false}>
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
