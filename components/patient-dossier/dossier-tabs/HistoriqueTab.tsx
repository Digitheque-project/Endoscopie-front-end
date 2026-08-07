"use client";

import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { AccordionSection } from "./AccordionSection";

interface HistoriqueTabProps {
  patientId: string;
}

const MODULE_ICONS: Record<string, string> = {
  creation: "add_circle",
  modification: "edit",
  consultation: "visibility",
  suppression: "delete",
  sortie: "logout",
  transfert: "sync_alt",
};

export function HistoriqueTab({ patientId }: HistoriqueTabProps) {
  const [historique, setHistorique] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiJson<any[]>(`/api/dossier-patient/${encodeURIComponent(patientId)}/historique`)
      .then((data) => setHistorique(Array.isArray(data) ? data : []))
      .catch(() => setHistorique([]))
      .finally(() => setIsLoading(false));
  }, [patientId]);

  return (
    <AccordionSection number="01" title="Historique complet du dossier" subtitle="Cliquez pour ouvrir" isComplete={false} defaultOpen>
      {isLoading ? (
        <p className="text-xs text-on-surface-variant">Chargement de l&apos;historique…</p>
      ) : !historique || historique.length === 0 ? (
        <p className="text-xs text-on-surface-variant">Aucun historique disponible pour l&apos;instant pour ce patient.</p>
      ) : (
        <ul className="space-y-2">
          {historique.map((h, i) => {
            const action = (h.action || h.type || "").toLowerCase();
            const icon = MODULE_ICONS[action] || "history";
            return (
              <li key={h.id ?? i} className="flex items-start gap-3 rounded-lg border border-outline-variant/20 p-3 text-xs">
                <span className="material-symbols-outlined text-[18px] text-primary shrink-0">{icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-on-surface">{h.module || h.description || "Action"}</span>
                    <span className="text-on-surface-variant shrink-0">
                      {h.date || h.createdAt ? new Date(h.date || h.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : ""}
                    </span>
                  </div>
                  {h.auteur && <p className="text-on-surface-variant">Par {h.auteur}</p>}
                  {h.details && <p className="text-on-surface-variant">{h.details}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AccordionSection>
  );
}
