"use client";

import { AccordionSection } from "./AccordionSection";

/**
 * Aucune source de données pour les avis médicaux (demandes d'avis spécialisé) n'existe
 * encore ni côté Endoscopie, ni côté dossier-patient-back (module vérifié inexistant) —
 * onglet présent pour la cohérence visuelle avec les autres services CHU, mais pas
 * d'appel réseau tant qu'aucune vraie route n'existe : pas la peine d'appeler dans le
 * vide pour simuler un chargement qui échouera systématiquement.
 */
export function AvisTab() {
  return (
    <AccordionSection number="01" title="Avis médicaux" subtitle="Non disponible" isComplete={false} defaultOpen>
      <p className="text-xs text-on-surface-variant">
        Les avis médicaux (demandes d&apos;avis spécialisé) ne sont pas encore disponibles dans le
        dossier patient CHU partagé — cet onglet apparaîtra dès que la fonctionnalité existera côté
        service partagé.
      </p>
    </AccordionSection>
  );
}
