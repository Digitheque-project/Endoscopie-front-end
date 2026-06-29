"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { RequireRole } from "@/components/auth/RequireRole";
import { apiJson, updateRendezVous } from "@/lib/api";

type RendezVousRow = {
  id: string;
  patientId: string | null;
  patient: { id: string; nom: string; prenom: string } | null;
  prescriptionId: string | null;
  prescription: { typeExamen?: string } | null;
  dateHeureDebut: string;
  typeAnesthesie: string | null;
  statut: string;
};

function DecisionsList() {
  const router = useRouter();
  const [rows, setRows] = useState<RendezVousRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  const decided = rows
    .filter((r) => r.statut === "Décision rendue")
    .sort((a, b) => new Date(a.dateHeureDebut).getTime() - new Date(b.dateHeureDebut).getTime());

  const handleConfirm = async (rdv: RendezVousRow) => {
    setActingId(rdv.id);
    setActionError(null);
    try {
      await updateRendezVous(rdv.id, { statut: "Confirmé" });
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Erreur lors de la confirmation.");
    } finally {
      setActingId(null);
    }
  };

  const handleDemandeCpa = (rdv: RendezVousRow) => {
    const params = new URLSearchParams();
    if (rdv.patientId) params.set("patientId", rdv.patientId);
    if (rdv.prescriptionId) params.set("prescriptionId", rdv.prescriptionId);
    if (rdv.patient) params.set("patientName", `${rdv.patient.nom} ${rdv.patient.prenom}`);
    if (rdv.prescription?.typeExamen) params.set("procedure", rdv.prescription.typeExamen);
    router.push(`/demande-cpa?${params.toString()}`);
  };

  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
      <RequireRole role="MAJOR">
        <div>
          <h1 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">
            Décisions à valider
          </h1>
          <p className="text-on-surface-variant font-medium mt-1">
            Décisions d&apos;anesthésie rendues par les médecins, en attente de confirmation ou de demande de CPA.
          </p>
        </div>

        {actionError && (
          <div className="rounded-xl border border-error/20 bg-error-container/10 px-4 py-3 text-sm text-error">
            {actionError}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Patient</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Procédure</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Date / Heure</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Anesthésie décidée</th>
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
              ) : decided.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant text-sm">
                    Aucune décision en attente de traitement.
                  </td>
                </tr>
              ) : (
                decided.map((rdv) => (
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
                    <td className="px-6 py-3">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-wider">
                        {rdv.typeAnesthesie}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => router.push(`/patient-dossier/${rdv.prescriptionId}`)}
                          className="px-3 py-2 rounded-lg border border-outline-variant/30 text-on-surface-variant text-xs font-bold hover:bg-surface-container-low transition-colors"
                        >
                          Dossier
                        </button>
                        {rdv.typeAnesthesie === "Locale" ? (
                          <button
                            type="button"
                            disabled={actingId === rdv.id}
                            onClick={() => handleConfirm(rdv)}
                            className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            Confirmer
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDemandeCpa(rdv)}
                            className="px-4 py-2 rounded-lg bg-[#EA580C] text-white text-xs font-bold hover:opacity-90 transition-opacity"
                          >
                            Demande de CPA
                          </button>
                        )}
                      </div>
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

export default function DecisionsMajorPage() {
  return <DecisionsList />;
}
