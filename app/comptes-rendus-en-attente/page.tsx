"use client";

import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { RequireRole } from "@/components/auth/RequireRole";
import SelectFilter from "@/components/ui/SelectFilter";
import ComboboxFilter from "@/components/ui/ComboboxFilter";
import { apiJson } from "@/lib/api";
import { usePatient } from "@/contexts/PatientContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
    const patientName = `${row.patient?.nom || ""} ${row.patient?.prenom || ""}`.trim();
    const prescriberName = `Dr. ${row.medecinPrescripteur?.prenom || ""} ${row.medecinPrescripteur?.nom || ""}`.trim();
    setPatientData({
      patientId: row.patient?.id || row.patientId || "",
      prescriptionId: row.id || "",
      patientName,
      procedure: row.typeExamen || "",
      prescriber: prescriberName,
      priority: row.priorite || "NORMAL",
    });
    router.push("/resultat-endoscopie");
  };

  const filtered = rows.filter((row) => {
    const patientName = `${row.patient?.nom || ""} ${row.patient?.prenom || ""}`.trim().toLowerCase();
    const prescriberName = `Dr. ${row.medecinPrescripteur?.prenom || ""} ${row.medecinPrescripteur?.nom || ""}`.trim().toLowerCase();
    const matchesNom = patientName.includes(filters.nom.toLowerCase());
    const matchesProc = (row.typeExamen || "").toLowerCase().includes(filters.procedure.toLowerCase());
    const matchesMed = prescriberName.includes(filters.medecin.toLowerCase());
    return matchesNom && matchesProc && matchesMed;
  });

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
                    <th className="px-4 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} className="border-t border-outline-variant/10 hover:bg-surface-container/50">
                      <td className="px-4 py-2.5 font-semibold text-on-surface">
                        {`${row.patient?.nom || ""} ${row.patient?.prenom || ""}`.trim() || "Patient inconnu"}
                      </td>
                      <td className="px-4 py-2.5 text-on-surface-variant">{row.typeExamen}</td>
                      <td className="px-4 py-2.5 text-on-surface-variant">
                        {row.medecinPrescripteur ? `Dr. ${row.medecinPrescripteur.prenom} ${row.medecinPrescripteur.nom}` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-on-surface-variant">
                        {row.rendezVous?.dateHeureDebut
                          ? new Date(row.rendezVous.dateHeureDebut).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => handleRediger(row)}
                          className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-white transition-all duration-200 hover:opacity-90"
                        >
                          Rédiger le compte-rendu
                        </button>
                      </td>
                    </tr>
                  ))}
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
