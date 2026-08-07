"use client";

import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { AccordionSection } from "./AccordionSection";

interface SuiviTabProps {
  patientId: string;
}

export function SuiviTab({ patientId }: SuiviTabProps) {
  const [suivis, setSuivis] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiJson<any[]>(`/api/dossier-patient/${encodeURIComponent(patientId)}/suivis`)
      .then((data) => setSuivis(Array.isArray(data) ? data : []))
      .catch(() => setSuivis([]))
      .finally(() => setIsLoading(false));
  }, [patientId]);

  const sorted = suivis ? [...suivis].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()) : [];

  if (isLoading) {
    return <p className="text-xs text-on-surface-variant">Chargement des suivis…</p>;
  }

  return (
    <AccordionSection number="01" title="Suivis / Évolution" subtitle="Cliquez pour ouvrir" isComplete={false} defaultOpen>
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
  );
}
