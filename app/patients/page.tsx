"use client";

import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRendezVousSync } from "@/lib/hooks/useRendezVousSync";
import { usePatient } from "@/contexts/PatientContext";

function computeAge(dateNaissance?: string | null): number | null {
  if (!dateNaissance) return null;
  const birth = new Date(dateNaissance);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

function statusStyle(statut: string) {
  switch (statut) {
    case "Terminé":
      return { color: "text-green-700", dot: "bg-green-500", pulse: false };
    case "En cours":
      return { color: "text-blue-700", dot: "bg-blue-500", pulse: true };
    case "Annulé":
      return { color: "text-red-700", dot: "bg-red-400", pulse: false };
    case "Urgent":
    case "Priorité":
      return { color: "text-orange-700", dot: "bg-orange-500", pulse: true };
    default:
      return { color: "text-orange-700", dot: "bg-orange-400", pulse: false };
  }
}

export default function PatientsPage() {
  const router = useRouter();
  const { setPatientData } = usePatient();
  const { rendezVous, loading } = useRendezVousSync({ refreshInterval: 15000 });
  const [filters, setFilters] = useState({ nom: "", procedure: "", medecin: "", date: "" });
  const [showFilters, setShowFilters] = useState(false);

  const filteredPatients = rendezVous.filter((rdv) => {
    const name = rdv.patient ? `${rdv.patient.nom} ${rdv.patient.prenom}` : "";
    const matchesNom = name.toLowerCase().includes(filters.nom.toLowerCase());
    const matchesProc = (rdv.typeExamen || "").toLowerCase().includes(filters.procedure.toLowerCase());
    const matchesMedecin = rdv.medecin
      ? `${rdv.medecin.nom} ${rdv.medecin.prenom}`.toLowerCase().includes(filters.medecin.toLowerCase())
      : !filters.medecin;
    return matchesNom && matchesProc && matchesMedecin;
  });

  const totalToday = rendezVous.length;
  const enAttente = rendezVous.filter((r) => r.statut === "Prevu" || r.statut === "Confirmé").length;
  const enCours = rendezVous.filter((r) => r.statut === "En cours").length;
  const termine = rendezVous.filter((r) => r.statut === "Terminé").length;

  const goToChecklist = (rdv: (typeof rendezVous)[number]) => {
    setPatientData({
      patientId: rdv.patient?.id || "",
      prescriptionId: rdv.prescriptionId || "",
      patientName: rdv.patient ? `${rdv.patient.nom} ${rdv.patient.prenom}` : "",
      procedure: rdv.typeExamen || "",
    });
    router.push("/checklists/avant");
  };

  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        <PageToolbar>
          <p className="text-on-surface-variant font-medium">Programmation du jour — Endoscopie</p>
        </PageToolbar>

        <div className="flex gap-4 overflow-x-auto pb-2">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex-1 min-w-[140px]">
            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">TOTAL AUJOURD&apos;HUI</p>
            <p className="text-2xl font-headline font-extrabold text-blue-900">{totalToday}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex-1 min-w-[140px]">
            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">EN ATTENTE</p>
            <p className="text-2xl font-headline font-extrabold text-orange-600">{enAttente}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex-1 min-w-[140px]">
            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">EN COURS</p>
            <p className="text-2xl font-headline font-extrabold text-blue-600">{enCours}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex-1 min-w-[140px]">
            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">TERMINÉ</p>
            <p className="text-2xl font-headline font-extrabold text-green-600">{termine}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-headline font-bold text-blue-900">Programmation du Jour</h3>
            <div className="flex gap-2 relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-2 ${
                  showFilters ? "bg-primary text-white border-primary" : "border-slate-200 text-slate-600 hover:bg-white"
                }`}
              >
                <span className="material-symbols-outlined text-sm">filter_list</span>
                Filtrer
                {(filters.nom || filters.procedure || filters.medecin) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 absolute -top-0.5 -right-0.5 animate-pulse" />
                )}
              </button>

              {showFilters && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-5 z-30 space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h5 className="font-bold text-xs text-slate-700">Filtres</h5>
                    <button
                      onClick={() => setFilters({ nom: "", procedure: "", medecin: "", date: "" })}
                      className="text-[10px] font-bold text-blue-600 uppercase hover:underline"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400">Nom</label>
                      <input
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none"
                        type="text"
                        placeholder="Nom du patient..."
                        value={filters.nom}
                        onChange={(e) => setFilters({ ...filters, nom: e.target.value })}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400">Procédure</label>
                      <input
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none"
                        type="text"
                        placeholder="Ex: Coloscopie..."
                        value={filters.procedure}
                        onChange={(e) => setFilters({ ...filters, procedure: e.target.value })}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400">Médecin</label>
                      <input
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none"
                        type="text"
                        placeholder="Rechercher..."
                        value={filters.medecin}
                        onChange={(e) => setFilters({ ...filters, medecin: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Nom du Patient</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Type d&apos;Examen</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Heure prévue</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Statut</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500 text-sm">
                      Chargement…
                    </td>
                  </tr>
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500 text-sm">
                      Aucun patient ne correspond à vos filtres.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((rdv) => {
                    const age = computeAge(rdv.patient?.dateNaissance);
                    const gender = rdv.patient?.sexe === "F" ? "Femme" : rdv.patient?.sexe === "M" ? "Homme" : null;
                    const initials = rdv.patient ? `${rdv.patient.nom[0] || ""}${rdv.patient.prenom[0] || ""}`.toUpperCase() : "?";
                    const style = statusStyle(rdv.statut);
                    return (
                      <tr key={rdv.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => rdv.prescriptionId && router.push(`/patient-dossier/${rdv.prescriptionId}`)}
                            disabled={!rdv.prescriptionId}
                            className="flex items-center gap-3 group text-left disabled:cursor-default"
                          >
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-slate-200 text-slate-600">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors">
                                {rdv.patient ? `${rdv.patient.nom} ${rdv.patient.prenom}` : "Patient inconnu"}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {age != null ? `${age} ans` : ""}
                                {age != null && gender ? " • " : ""}
                                {gender || ""}
                              </p>
                            </div>
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-[10px] font-bold rounded uppercase tracking-wider">
                            {rdv.typeExamen || "Non spécifié"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-700 text-center">
                          {new Date(rdv.dateHeureDebut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${style.dot} ${style.pulse ? "animate-pulse" : ""}`}></div>
                            <span className={`text-xs font-semibold ${style.color}`}>{rdv.statut}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => goToChecklist(rdv)}
                              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[10px] px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all font-bold flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[14px]">playlist_add_check</span> Check-list
                            </button>
                            <button
                              type="button"
                              onClick={() => rdv.prescriptionId && router.push(`/patient-dossier/${rdv.prescriptionId}`)}
                              disabled={!rdv.prescriptionId}
                              className="p-2 text-blue-900 hover:bg-blue-100 rounded-lg transition-all disabled:opacity-30"
                              title="Voir dossier"
                            >
                              <span className="material-symbols-outlined">folder_shared</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Affichage de {filteredPatients.length} patient{filteredPatients.length === 1 ? "" : "s"} sur {totalToday} aujourd&apos;hui
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
