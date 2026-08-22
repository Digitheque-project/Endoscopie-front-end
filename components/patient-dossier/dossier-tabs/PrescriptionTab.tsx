"use client";

import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { AccordionSection } from "./AccordionSection";
import { capitalizeFirst } from "@/components/voice/formatTranscript";
import { getExamTypeBadgeClass } from "@/lib/exam-type-colors";

interface PrescriptionTabProps {
  patientId: string;
}

/**
 * Propre à Endoscopie (données locales, pas le dossier CHU partagé) — liste les demandes
 * d'examen Endoscopie de ce patient, à l'identique du Fil de travail. Lecture seule comme
 * le reste du dossier patient : aucune action possible ici (planifier, décider...), juste
 * consulter — ces actions restent dans le Fil de travail.
 */
export function PrescriptionTab({ patientId }: PrescriptionTabProps) {
  const [prescriptions, setPrescriptions] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setHasError(false);
    apiJson<any[]>("/api/prescriptions")
      .then((all) => {
        if (cancelled) return;
        const mine = (Array.isArray(all) ? all : []).filter((p) => p.patientId === patientId);
        mine.sort((a, b) => new Date(b.dateDemande || 0).getTime() - new Date(a.dateDemande || 0).getTime());
        setPrescriptions(mine);
      })
      .catch(() => {
        if (!cancelled) {
          setHasError(true);
          setPrescriptions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  return (
    <>
      {hasError && (
        <p className="mb-3 rounded-lg border border-error/20 bg-error-container/10 px-3 py-2 text-xs text-error">
          Impossible de charger les prescriptions pour l&apos;instant — réessayez plus tard.
        </p>
      )}
      <AccordionSection number="01" title="Demandes d'examen Endoscopie" subtitle="Cliquez pour ouvrir" isComplete={false} defaultOpen>
        {isLoading ? (
          <p className="text-xs text-on-surface-variant">Chargement des prescriptions…</p>
        ) : !prescriptions || prescriptions.length === 0 ? (
          <p className="text-xs text-on-surface-variant">Aucune demande d&apos;examen Endoscopie pour ce patient.</p>
        ) : (
          <ul className="space-y-2">
            {prescriptions.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant/20 p-3 text-xs">
                <div className="min-w-0">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getExamTypeBadgeClass(p.typeExamen)}`}>
                    {capitalizeFirst(p.typeExamen)}
                  </span>
                  {p.motif && <p className="mt-1 text-on-surface-variant truncate">{p.motif}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-on-surface">{p.statut}</p>
                  {p.dateDemande && (
                    <p className="text-on-surface-variant">{new Date(p.dateDemande).toLocaleDateString("fr-FR")}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </AccordionSection>
    </>
  );
}
