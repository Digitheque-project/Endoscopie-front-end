"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { RequireRole } from "@/components/auth/RequireRole";
import { apiJson } from "@/lib/api";

type RendezVousRow = {
  id: string;
  patient: { id: string; nom: string; prenom: string } | null;
  salle: { nom: string } | null;
  prescriptionId: string | null;
  prescription: { typeExamen?: string; motif?: string } | null;
  dateHeureDebut: string;
  typeAnesthesie: string | null;
  statut: string;
};

const EXCLUDED_STATUTS = new Set(["Annulé", "Terminé"]);

function PendingDecisions() {
  const router = useRouter();
  const [rows, setRows] = useState<RendezVousRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    try {
      const data = await apiJson<RendezVousRow[]>("/api/rendezvous");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Erreur chargement rendez-vous", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const pending = rows
    .filter(
      (r) =>
        r.prescriptionId &&
        !r.typeAnesthesie &&
        !EXCLUDED_STATUTS.has(r.statut),
    )
    .sort((a, b) => new Date(a.dateHeureDebut).getTime() - new Date(b.dateHeureDebut).getTime());

  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
      <RequireRole role="MEDECIN">
        <div>
          <h1 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">
            Anesthésie à décider
          </h1>
          <p className="text-on-surface-variant font-medium mt-1">
            Rendez-vous planifiés par le major, en attente d&apos;une décision d&apos;anesthésie.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Patient</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Procédure</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Date / Heure</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Salle</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant text-sm">
                    Chargement…
                  </td>
                </tr>
              ) : pending.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant text-sm">
                    Aucune décision d&apos;anesthésie en attente.
                  </td>
                </tr>
              ) : (
                pending.map((rdv) => (
                  <tr key={rdv.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-3 text-sm font-bold text-on-surface">
                      {rdv.patient ? `${rdv.patient.nom} ${rdv.patient.prenom}` : "Patient inconnu"}
                    </td>
                    <td className="px-6 py-3 text-sm text-on-surface-variant">
                      {rdv.prescription?.typeExamen || "Non spécifié"}
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-on-surface">
                      {new Date(rdv.dateHeureDebut).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-6 py-3 text-sm text-on-surface-variant">{rdv.salle?.nom || "—"}</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => router.push(`/decisions-anesthesie/${rdv.prescriptionId}`)}
                        className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 transition-opacity"
                      >
                        Planifier l&apos;examen
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </RequireRole>
      </div>
    </AppShell>
  );
}

export default function DecisionsAnesthesiePage() {
  return <PendingDecisions />;
}
