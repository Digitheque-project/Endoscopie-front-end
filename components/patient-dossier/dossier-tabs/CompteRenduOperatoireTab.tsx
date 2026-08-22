"use client";

import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { AccordionSection } from "./AccordionSection";
import { capitalizeFirst } from "@/components/voice/formatTranscript";
import { getExamTypeBadgeClass } from "@/lib/exam-type-colors";

interface CompteRenduOperatoireTabProps {
  patientId: string;
}

const CHAMPS_DETAIL: { key: string; label: string }[] = [
  { key: "conclusion", label: "Conclusion" },
  { key: "observations", label: "Observations" },
  { key: "mainDiagnosis", label: "Diagnostic principal" },
  { key: "complication", label: "Complications" },
  { key: "biopsy", label: "Biopsie" },
  { key: "followUp", label: "Recommandations" },
];

/**
 * Propre à Endoscopie (données locales) — comptes rendus opératoires déjà rédigés pour ce
 * patient, avec le détail complet (pas que la conclusion, même logique que l'API externe
 * corrigée pour dossier-patient-back). Lecture seule : consultation uniquement, la
 * rédaction reste dans le module Rapport / Résultat endoscopie.
 */
export function CompteRenduOperatoireTab({ patientId }: CompteRenduOperatoireTabProps) {
  const [resultats, setResultats] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setHasError(false);
    apiJson<any[]>(`/api/resultats/patient/${encodeURIComponent(patientId)}`)
      .then((data) => {
        if (!cancelled) setResultats(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) {
          setHasError(true);
          setResultats([]);
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
          Impossible de charger les comptes rendus pour l&apos;instant — réessayez plus tard.
        </p>
      )}
      {isLoading ? (
        <p className="text-xs text-on-surface-variant">Chargement des comptes rendus…</p>
      ) : !resultats || resultats.length === 0 ? (
        <AccordionSection number="01" title="Comptes rendus opératoires" subtitle="Aucun pour l'instant" isComplete={false} defaultOpen>
          <p className="text-xs text-on-surface-variant">Aucun compte rendu opératoire Endoscopie pour ce patient.</p>
        </AccordionSection>
      ) : (
        resultats.map((r, i) => (
          <AccordionSection
            key={r.id ?? i}
            number={String(i + 1).padStart(2, "0")}
            title={r.prescription?.typeExamen ? capitalizeFirst(r.prescription.typeExamen) : "Compte rendu"}
            subtitle={r.dateCreation ? new Date(r.dateCreation).toLocaleDateString("fr-FR") : undefined}
            isComplete
            defaultOpen={i === 0}
          >
            {r.prescription?.typeExamen && (
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getExamTypeBadgeClass(r.prescription.typeExamen)}`}>
                {capitalizeFirst(r.prescription.typeExamen)}
              </span>
            )}
            <div className="space-y-2 text-xs">
              {CHAMPS_DETAIL.filter((c) => r[c.key]).map((c) => (
                <div key={c.key}>
                  <p className="font-bold text-on-surface">{c.label}</p>
                  <p className="text-on-surface-variant whitespace-pre-line">{r[c.key]}</p>
                </div>
              ))}
              {CHAMPS_DETAIL.every((c) => !r[c.key]) && (
                <p className="text-on-surface-variant">Aucun détail renseigné dans ce compte rendu.</p>
              )}
            </div>
          </AccordionSection>
        ))
      )}
    </>
  );
}
