"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { apiJson } from "@/lib/api";
import { PriseEnChargeBadge, priseEnChargeStripeClass } from "@/components/patient/PriseEnChargeBadge";

interface ArchiveRow {
  prescriptionId: string;
  patientId: string;
  patientNom: string;
  patientPrenom: string;
  priseEnChargeId: string | null;
  typeExamen: string;
  typeAnesthesie: string | null;
  dateDemande: string;
  prescripteur: string | null;
  statutPrescription: string;
  cpaStatut: string | null;
  checklistAvantValide: boolean;
  checklistApresValide: boolean;
  resultatDisponible: boolean;
  statutGlobal: "Complet" | "En cours" | "Annulé";
}

function exportCsv(rows: ArchiveRow[]) {
  const header = ["Date", "Patient", "Examen", "Anesthésie", "Prescripteur", "Statut CPA", "Checklist avant", "Checklist après", "Résultat", "Statut global"];
  const lines = rows.map((r) => [
    new Date(r.dateDemande).toLocaleDateString("fr-FR"),
    `${r.patientNom} ${r.patientPrenom}`,
    r.typeExamen,
    r.typeAnesthesie || "",
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

const ANESTHESIE_OPTIONS = ["Locale", "Générale"];
const EMPTY_FILTERS = { nom: "", dateFrom: "", dateTo: "", typeExamen: "", typeAnesthesie: "", motCle: "" };

export default function ArchivesPage() {
  const router = useRouter();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [rows, setRows] = useState<ArchiveRow[]>([]);
  const [examTypes, setExamTypes] = useState<string[]>([]);
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
      if (f.typeExamen) params.set("typeExamen", f.typeExamen);
      if (f.typeAnesthesie) params.set("typeAnesthesie", f.typeAnesthesie);
      if (f.motCle) params.set("motCle", f.motCle);
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
    fetchArchives(EMPTY_FILTERS);
    apiJson<string[]>("/api/archives/types-examen")
      .then((data) => setExamTypes(Array.isArray(data) ? data : []))
      .catch(() => setExamTypes([]));
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    fetchArchives(filters);
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    fetchArchives(EMPTY_FILTERS);
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

          <form onSubmit={handleSearch} className="flex flex-nowrap items-end gap-2 mb-6 overflow-x-auto">
            <div className="flex flex-col gap-1.5 shrink-0">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Patient</label>
              <input
                type="text"
                value={filters.nom}
                onChange={(e) => setFilters({ ...filters, nom: e.target.value })}
                placeholder="Nom ou prénom"
                title={filters.nom}
                className="truncate bg-blue-50 border border-blue-200 text-blue-900 placeholder:text-blue-400 rounded-lg px-3 py-2 text-xs font-medium w-28 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Du</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="truncate bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-2 py-2 text-xs font-medium w-28 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Au</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="truncate bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-2 py-2 text-xs font-medium w-28 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Examen</label>
              <select
                value={filters.typeExamen}
                onChange={(e) => setFilters({ ...filters, typeExamen: e.target.value })}
                title={filters.typeExamen || "Tous les examens"}
                className="truncate bg-violet-50 border border-violet-200 text-violet-900 rounded-lg px-2 py-2 text-xs font-medium w-28 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
              >
                <option value="">Tous les examens</option>
                {examTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Anesthésie</label>
              <select
                value={filters.typeAnesthesie}
                onChange={(e) => setFilters({ ...filters, typeAnesthesie: e.target.value })}
                title={filters.typeAnesthesie || "Locale ou générale"}
                className="truncate bg-rose-50 border border-rose-200 text-rose-900 rounded-lg px-2 py-2 text-xs font-medium w-28 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none"
              >
                <option value="">Locale ou générale</option>
                {ANESTHESIE_OPTIONS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Mot-clé</label>
              <input
                type="text"
                value={filters.motCle}
                onChange={(e) => setFilters({ ...filters, motCle: e.target.value })}
                placeholder="Ex : polype..."
                title={filters.motCle}
                className="truncate bg-emerald-50 border border-emerald-200 text-emerald-900 placeholder:text-emerald-400 rounded-lg px-3 py-2 text-xs font-medium w-28 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
              />
            </div>
            <button type="submit" className="shrink-0 whitespace-nowrap px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 transition-opacity">
              Rechercher
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="shrink-0 whitespace-nowrap px-3 py-2 rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
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
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Anesthésie</th>
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
                      className={`hover:bg-surface-container-low transition-colors cursor-pointer ${priseEnChargeStripeClass(!!row.priseEnChargeId)}`}
                    >
                      <td className="px-4 py-3 text-sm">{new Date(row.dateDemande).toLocaleDateString("fr-FR")}</td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        <div>{row.patientNom} {row.patientPrenom}</div>
                        <PriseEnChargeBadge priseEnChargeId={row.priseEnChargeId} className="mt-0.5" />
                      </td>
                      <td className="px-4 py-3 text-sm">{row.typeExamen}</td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">{row.typeAnesthesie || "—"}</td>
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
                            row.statutGlobal === "Complet"
                              ? "bg-emerald-100 text-emerald-700"
                              : row.statutGlobal === "Annulé"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
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
