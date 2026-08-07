"use client";

import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { AccordionSection } from "./AccordionSection";

interface ResultatsParacliniquesTabProps {
  patientId: string;
}

const TYPE_LABELS: Record<string, string> = {
  labo: "Laboratoire",
  imagerie: "Imagerie",
  endoscopie: "Endoscopie",
  "anatomo-patho": "Anatomopathologie",
  autre: "Autre",
};

const STATUT_COLORS: Record<string, string> = {
  demande: "bg-slate-100 text-slate-600",
  "en cours": "bg-amber-100 text-amber-700",
  disponible: "bg-success-container text-success",
  lu: "bg-primary/10 text-primary",
};

export function ResultatsParacliniquesTab({ patientId }: ResultatsParacliniquesTabProps) {
  const [resultats, setResultats] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState("");

  const load = () => {
    setIsLoading(true);
    apiJson<any[]>(`/api/dossier-patient/${encodeURIComponent(patientId)}/resultats`)
      .then((data) => setResultats(Array.isArray(data) ? data : []))
      .catch(() => setResultats([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    setFilterType("");
  }, [patientId]);

  const handleMarkLu = async (resultatId: string) => {
    try {
      await apiJson(`/api/dossier-patient/${encodeURIComponent(patientId)}/resultats/${encodeURIComponent(resultatId)}/lu`, { method: "PATCH" });
      load();
    } catch (e) {
      console.error("Erreur marquage résultat comme lu :", e);
    }
  };

  const types = resultats ? Array.from(new Set(resultats.map((r) => (r.type || "").toLowerCase()).filter(Boolean))) : [];
  const filtered = resultats ? (filterType ? resultats.filter((r) => (r.type || "").toLowerCase() === filterType) : resultats) : [];

  return (
    <AccordionSection number="01" title="Résultats paracliniques" subtitle="Cliquez pour ouvrir" isComplete={false} defaultOpen>
      {isLoading ? (
        <p className="text-xs text-on-surface-variant">Chargement des résultats…</p>
      ) : !resultats || resultats.length === 0 ? (
        <p className="text-xs text-on-surface-variant">Aucun résultat paraclinique disponible pour l&apos;instant pour ce patient.</p>
      ) : (
        <div className="space-y-3">
          {types.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setFilterType("")}
                className={`px-3 py-1 rounded-full text-[11px] font-bold ${!filterType ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>
                Tous
              </button>
              {types.map((t) => (
                <button key={t} type="button" onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold ${filterType === t ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>
                  {TYPE_LABELS[t] || t}
                </button>
              ))}
            </div>
          )}
          <ul className="space-y-2">
            {filtered.map((r, i) => {
              const statut = (r.statut || "").toLowerCase();
              return (
                <li key={r.id ?? i} className="rounded-lg border border-outline-variant/20 p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-on-surface">{r.titre || TYPE_LABELS[(r.type || "").toLowerCase()] || "Résultat"}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${STATUT_COLORS[statut] || "bg-surface-container text-on-surface-variant"}`}>
                      {r.statut || "—"}
                    </span>
                  </div>
                  {r.date && <p className="text-on-surface-variant">{new Date(r.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</p>}
                  {r.description && <p className="text-on-surface-variant">{r.description}</p>}
                  {statut === "disponible" && r.id && (
                    <button type="button" onClick={() => handleMarkLu(r.id)} className="mt-1 text-[11px] font-bold text-primary hover:underline">
                      Marquer comme lu
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </AccordionSection>
  );
}
