"use client";

import { AccordionSection } from "./AccordionSection";

/**
 * Le module Sortie Médicale existe bien côté dossier-patient-back, mais ses routes sont
 * indexées par episodeId (un identifiant d'épisode d'hospitalisation), pas par patientId —
 * et aucune route de correspondance patientId -> episodeId n'existe (vérifié dans son
 * code source). Endoscopie ne connaît pas cet episodeId, donc impossible d'appeler cette
 * route de façon fiable pour l'instant. Onglet présent pour la cohérence visuelle avec les
 * autres services CHU, sans appel réseau voué à échouer.
 */
export function SortieTab() {
  return (
    <AccordionSection number="01" title="Sortie médicale" subtitle="Non disponible" isComplete={false} defaultOpen>
      <p className="text-xs text-on-surface-variant">
        La sortie médicale n&apos;est pas consultable depuis Endoscopie pour l&apos;instant — le dossier
        patient CHU partagé l&apos;indexe par épisode d&apos;hospitalisation, une information dont
        Endoscopie ne dispose pas.
      </p>
    </AccordionSection>
  );
}
