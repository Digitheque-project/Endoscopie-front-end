"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { apiJson } from "@/lib/api";

interface ArchiveRow {
  prescriptionId: string;
  patientId: string;
  patientNom: string;
  patientPrenom: string;
  typeExamen: string;
  dateDemande: string;
  prescripteur: string | null;
  statutPrescription: string;
  cpaStatut: string | null;
  checklistAvantValide: boolean;
  checklistApresValide: boolean;
  resultatDisponible: boolean;
  statutGlobal: "Complet" | "En cours";
}

function exportCsv(rows: ArchiveRow[]) {
  const header = ["Date", "Patient", "Examen", "Prescripteur", "Statut CPA", "Checklist avant", "Checklist après", "Résultat", "Statut global"];
  const lines = rows.map((r) => [
    new Date(r.dateDemande).toLocaleDateString("fr-FR"),
    `${r.patientNom} ${r.patientPrenom}`,
    r.typeExamen,
    r.prescripteur || "",
    r.cpaStatut || "",
    r.checklistAvantValide ? "Validée" : "Non validée",
    r.checklistApresValide ? "Validée" : "Non validée",
    r.resultatDisponible ? "Disponible" : "En attente",
    r.statutGlobal,
  ]);
  const csv = [header, ...lines]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `archives-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ArchivesPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({ nom: "", dateFrom: "", dateTo: "" });
  const [rows, setRows] = useState<ArchiveRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArchives = async (f: typeof filters) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (f.nom) params.set("nom", f.nom);
      if (f.dateFrom) params.set("dateFrom", f.dateFrom);
      if (f.dateTo) params.set("dateTo", f.dateTo);
      const data = await apiJson<ArchiveRow[]>(`/api/archives?${params.toString()}`);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur chargement archives :", err);
      setError("Impossible de charger les archives.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives({ nom: "", dateFrom: "", dateTo: "" });
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    fetchArchives(filters);
  };

  const handleReset = () => {
    const empty = { nom: "", dateFrom: "", dateTo: "" };
    setFilters(empty);
    fetchArchives(empty);
  };

  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        <PageToolbar />

        <div className="bg-white rounded-xl p-6 shadow-sm border border-outline-variant/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline text-xl font-bold">Recherche archive</h2>
            <button
              type="button"
              onClick={() => exportCsv(rows)}
              disabled={rows.length === 0}
              className="px-4 py-2 rounded-lg border border-outline-variant/20 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Exporter
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4 mb-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Patient</label>
              <input
                type="text"
                value={filters.nom}
                onChange={(e) => setFilters({ ...filters, nom: e.target.value })}
                placeholder="Nom ou prénom"
                className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg px-4 py-2 text-sm font-medium w-56"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Du</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg px-4 py-2 text-sm font-medium"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Au</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg px-4 py-2 text-sm font-medium"
              />
            </div>
            <button type="submit" className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity">
              Rechercher
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              Réinitialiser
            </button>
          </form>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-surface-container rounded-lg" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl opacity-30 mb-2 block">inventory_2</span>
              Aucun dossier trouvé pour ces critères.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Date</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Patient</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Examen</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Prescripteur</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">CPA</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Checklists</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Résultat</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {rows.map((row) => (
                    <tr
                      key={row.prescriptionId}
                      onClick={() => router.push(`/patient-dossier/${row.prescriptionId}`)}
                      className="hover:bg-surface-container-low transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm">{new Date(row.dateDemande).toLocaleDateString("fr-FR")}</td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        {row.patientNom} {row.patientPrenom}
                      </td>
                      <td className="px-4 py-3 text-sm">{row.typeExamen}</td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">{row.prescripteur || "—"}</td>
                      <td className="px-4 py-3 text-sm">{row.cpaStatut || "Non demandé"}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={row.checklistAvantValide ? "text-emerald-600" : "text-on-surface-variant"}>Avant</span>
                        {" / "}
                        <span className={row.checklistApresValide ? "text-emerald-600" : "text-on-surface-variant"}>Après</span>
                      </td>
                      <td className="px-4 py-3 text-sm">{row.resultatDisponible ? "Disponible" : "En attente"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-[11px] font-bold ${
                            row.statutGlobal === "Complet" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {row.statutGlobal}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
