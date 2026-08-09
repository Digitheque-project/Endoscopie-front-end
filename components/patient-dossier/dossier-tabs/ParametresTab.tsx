"use client";

import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { AccordionSection } from "./AccordionSection";

interface ParametresTabProps {
  patientId: string;
}

export function ParametresTab({ patientId }: ParametresTabProps) {
  const [parametres, setParametres] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    apiJson<any[]>(`/api/dossier-patient/${encodeURIComponent(patientId)}/parametres`)
      .then((data) => setParametres(Array.isArray(data) ? data : []))
      .catch(() => {
        setHasError(true);
        setParametres([]);
      })
      .finally(() => setIsLoading(false));
  }, [patientId]);

  const sorted = parametres
    ? [...parametres].sort((a, b) => new Date(b.mesureAt ?? b.createdAt ?? 0).getTime() - new Date(a.mesureAt ?? a.createdAt ?? 0).getTime())
    : [];

  if (isLoading) {
    return <p className="text-xs text-on-surface-variant">Chargement des paramètres…</p>;
  }

  return (
    <>
      {hasError && (
        <p className="mb-3 rounded-lg border border-error/20 bg-error-container/10 px-3 py-2 text-xs text-error">
          Impossible de contacter le service Dossier Patient CHU pour l&apos;instant — réessayez plus tard.
        </p>
      )}
      <AccordionSection number="01" title="Relevés de paramètres" subtitle="Cliquez pour ouvrir" isComplete={false} defaultOpen>
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
    </>
  );
}
