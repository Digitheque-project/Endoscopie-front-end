"use client";

import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { RequireRole } from "@/components/auth/RequireRole";
import SelectFilter from "@/components/ui/SelectFilter";
import ComboboxFilter from "@/components/ui/ComboboxFilter";
import { apiJson } from "@/lib/api";
import { usePatient } from "@/contexts/PatientContext";
import { PriseEnChargeBadge, priseEnChargeStripeClass } from "@/components/patient/PriseEnChargeBadge";
import { getExamTypeBadgeClass } from "@/lib/exam-type-colors";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function PendingReportsContent() {
  const router = useRouter();
  const { setPatientData } = usePatient();
const [rows, setRows] = useState<any[]>([]);
  const [examTypes, setExamTypes] = useState<{ id: string; name: string }[]>([]);
  const [doctorNames, setDoctorNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ nom: "", procedure: "", medecin: "" });

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [data, docsData, examTypesData] = await Promise.all([
        apiJson<any[]>('/api/prescriptions/pending-reports'),
        apiJson<any[]>('/api/medecins'),
        apiJson<{ id: string; name: string }[]>('/api/exam-types').catch(() => []),
      ]);
      setDoctorNames(
        (Array.isArray(docsData) ? docsData : []).map((d: any) => `Dr. ${d.prenom} ${d.nom}`.trim()),
      );
      setExamTypes(Array.isArray(examTypesData) ? examTypesData : []);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Erreur chargement comptes rendus en attente", e);
      setError("Impossible de contacter le serveur. Veuillez vérifier que le backend est lancé.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRediger = (row: any) => {
    router.push(`/dossier-seance/${encodeURIComponent(row.id)}`);
  };

  // Reprendre la documentation d'un examen interrompu (ex: panne électrique) :
  // la checklist avant reste acquise, on ré-ouvre juste la page de notes d'opération.
  const handleReprendre = (row: any) => {
    const patient = row.patient
      ? `${row.patient.nom || ""} ${row.patient.prenom || ""}`.trim()
      : "";
    setPatientData({
      patientId: row.patientId || row.patient?.id || "",
      prescriptionId: row.id,
      patientName: patient,
      procedure: row.typeExamen || "",
    });
    router.push("/prescription-workflow");
  };

  const filtered = rows.filter((row) => {
    const patientName = `${row.patient?.nom || ""} ${row.patient?.prenom || ""}`.trim().toLowerCase();
    const prescriberName = `Dr. ${row.medecinPrescripteur?.prenom || ""} ${row.medecinPrescripteur?.nom || ""}`.trim().toLowerCase();
    const matchesNom = patientName.includes(filters.nom.toLowerCase());
    const matchesProc = (row.typeExamen || "").toLowerCase().includes(filters.procedure.toLowerCase());
    const matchesMed = prescriberName.includes(filters.medecin.toLowerCase());
    return matchesNom && matchesProc && matchesMed;
  });

  // Regroupe les prescriptions qui partagent la même prescription externe multi-examens
  // (même patient, même créneau) en une seule ligne — sinon le nom du patient se
  // répétait une fois par procédure en attente.
  const groupedRows = useMemo(() => {
    const groups = new Map<string, any[]>();
    const order: string[] = [];
    for (const row of filtered) {
      const key = row.prescriptionExternalId || `single-${row.id}`;
      if (!groups.has(key)) {
        groups.set(key, []);
        order.push(key);
      }
      groups.get(key)!.push(row);
    }
    return order.map((key) => groups.get(key)!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        <RequireRole role="MEDECIN">
          <PageToolbar />

          <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4">
            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Nom du Patient
              </label>
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-primary/20 text-on-surface"
                type="text"
                placeholder="Rechercher un patient..."
                value={filters.nom}
                onChange={(e) => setFilters({ ...filters, nom: e.target.value })}
              />
            </div>
            <div className="min-w-[200px]">
              <SelectFilter
                label="Procédure"
                value={filters.procedure}
                onChange={(v) => setFilters({ ...filters, procedure: v })}
                options={examTypes.map((t) => ({ value: t.name, label: t.name }))}
              />
            </div>
            <div className="min-w-[220px]">
              <ComboboxFilter
                label="Médecin"
                value={filters.medecin}
                onChange={(v) => setFilters({ ...filters, medecin: v })}
                options={doctorNames}
                placeholder="Rechercher un médecin..."
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-error/20 bg-error-container/10 p-6 text-center">
              <span className="material-symbols-outlined text-4xl text-error mb-2">cloud_off</span>
              <p className="text-on-surface-variant mb-4">{error}</p>
              <button onClick={load} className="rounded-lg bg-error px-4 py-2 text-sm font-bold text-white hover:opacity-90">
                Réessayer
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">task_alt</span>
              <p className="text-on-surface-variant">Aucun compte-rendu en attente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-outline-variant/10 bg-white shadow-sm">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-surface-container-lowest text-xs uppercase tracking-wider text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-2.5">Patient</th>
                    <th className="px-4 py-2.5">Procédure</th>
                    <th className="px-4 py-2.5">Prescripteur</th>
                    <th className="px-4 py-2.5">Date de l'examen</th>
                    <th className="px-4 py-2.5">Statut</th>
                    <th className="px-4 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedRows.map((group) => {
                    const primary = group[0];
                    const withStatus = group.map((row) => {
                      const checklistValide = !!row.checklistApres?.estValide;
                      const operationCommencee = !!row.operationEndoscopie;
                      // Compte rendu déjà écrit mais checklist après pas encore validée —
                      // pas une interruption d'examen, juste une étape administrative
                      // oubliée (voir getPendingReports côté backend).
                      const checklistAFinaliser = !!row.hasResultat && !checklistValide;
                      return { row, interrompu: operationCommencee && !checklistValide && !row.hasResultat, checklistAFinaliser };
                    });
                    // Une seule procédure interrompue suffit à signaler toute la ligne — le
                    // bouton "Reprendre" cible précisément celle-là, pas forcément la première.
                    const interrompuEntry = withStatus.find((e) => e.interrompu);
                    const interrompu = !!interrompuEntry;
                    const aFinaliserEntry = withStatus.find((e) => e.checklistAFinaliser);
                    return (
                    <tr key={primary.prescriptionExternalId || primary.id} className={`border-t border-outline-variant/10 hover:bg-surface-container/50 ${interrompu ? "bg-amber-50" : ""} ${priseEnChargeStripeClass(!!primary.patient?.priseEnChargeId)}`}>
                      <td className="px-4 py-2.5 font-semibold text-on-surface">
                        <div>{`${primary.patient?.nom || ""} ${primary.patient?.prenom || ""}`.trim() || "Patient inconnu"}</div>
                        <PriseEnChargeBadge priseEnChargeId={primary.patient?.priseEnChargeId} className="mt-0.5" />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {group.map((row) => (
                            <span
                              key={row.id}
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${getExamTypeBadgeClass(row.typeExamen)}`}
                            >
                              {row.typeExamen}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-on-surface-variant">
                        {primary.medecinPrescripteur ? `Dr. ${primary.medecinPrescripteur.prenom} ${primary.medecinPrescripteur.nom}` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-on-surface-variant">
                        {primary.rendezVous?.dateHeureDebut
                          ? new Date(primary.rendezVous.dateHeureDebut).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        {interrompu ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                            <span className="material-symbols-outlined text-[13px]">bolt</span>
                            Interrompu
                          </span>
                        ) : aFinaliserEntry ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-bold text-sky-800">
                            <span className="material-symbols-outlined text-[13px]">checklist</span>
                            Checklist à finaliser
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-800">
                            <span className="material-symbols-outlined text-[13px]">check_circle</span>
                            Terminé
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {interrompuEntry && (
                            <button
                              onClick={() => handleReprendre(interrompuEntry.row)}
                              className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 transition-all duration-200 hover:bg-amber-100"
                            >
                              Reprendre l'examen
                            </button>
                          )}
                          <button
                            onClick={() => handleRediger(primary)}
                            className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-white transition-all duration-200 hover:opacity-90"
                          >
                            {aFinaliserEntry ? "Finaliser le dossier" : "Rédiger le compte-rendu"}
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </RequireRole>
      </div>
    </AppShell>
  );
}

export default function PendingReportsPage() {
  return <PendingReportsContent />;
}
