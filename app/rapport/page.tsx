"use client";

import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getAvailableEndoscopyTypes } from "@/lib/config/endoscopyTypes";

export default function RapportPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [filters, setFilters] = useState({ nom: "", procedure: "", medecin: "", date: "", status: "" });
  const [isResetting, setIsResetting] = useState(false);

  const fetchReports = async () => {
    try {
      const resp = await apiFetch('/api/resultats');
      console.log('[rapport] fetch /api/resultats status', resp.status);
      if (resp.ok) {
        const data = await resp.json();
        console.log('[rapport] fetched reports count', Array.isArray(data) ? data.length : typeof data);
        const mapped = data.map((item: any) => {
          const date = new Date(item.dateCreation);
          const iso = date.toISOString().split('T')[0];
          
          // Récupérer le type de procédure correct depuis la prescription
          let procedure = "Inconnu";
          if (item.prescription && item.prescription.typeExamen) {
            procedure = item.prescription.typeExamen;
          } else if (item.examType) {
            procedure = item.examType;
          }
          
          return {
            id: item.prescriptionId || item.id,
            name: item.patient ? `${item.patient.nom} ${item.patient.prenom}` : "Inconnu",
            procedure: procedure,
            surgeon: item.doctorName || "Non spécifié",
            status: "Validé", // In a real app, logic based on fields
            statusClass: "bg-green-100 text-green-700",
            date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
            dateISO: iso,
            time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          };
        });
        setReports(mapped);
      }
    } catch (err) {
      console.error("Erreur chargement des rapports:", err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResetFilters = async () => {
    setIsResetting(true);
    setFilters({ nom: "", procedure: "", medecin: "", date: "", status: "" });
    await fetchReports();
    setTimeout(() => setIsResetting(false), 600);
  };
  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/5 flex items-center justify-between">
              <div>
                <p className="text-sm text-on-surface-variant font-medium mb-1">Procédures Récents</p>
                <h3 className="text-2xl font-headline font-bold text-on-surface">{reports.length}</h3>
                <p className="text-xs text-[#1e8e3e] font-bold flex items-center gap-1 mt-2"><span className="material-symbols-outlined text-sm">trending_up</span> +12% vs hier</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">medical_information</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/5 flex items-center justify-between">
              <div>
                <p className="text-sm text-on-surface-variant font-medium mb-1">Taux de réussite</p>
                <h3 className="text-2xl font-headline font-bold text-on-surface">99.2%</h3>
                <p className="text-xs text-on-surface-variant font-medium mt-2">Moyenne historique: 98.4%</p>
              </div>
              <div className="w-12 h-12 bg-secondary-container/30 rounded-full flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined">verified</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/5 flex items-center justify-between">
              <div>
                <p className="text-sm text-on-surface-variant font-medium mb-1">Durée Moyenne</p>
                <h3 className="text-2xl font-headline font-bold text-on-surface">24m 15s</h3>
                <p className="text-xs text-tertiary font-bold flex items-center gap-1 mt-2"><span className="material-symbols-outlined text-sm">schedule</span> -2 min depuis la semaine dernière</p>
              </div>
              <div className="w-12 h-12 bg-tertiary-fixed/30 rounded-full flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined">hourglass_top</span>
              </div>
            </div>
          </section>

          <section className="flex flex-wrap items-end gap-4 bg-surface-container-low p-5 rounded-xl">
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Date Range</label>
              <div className="flex items-center gap-2 bg-surface-container-lowest rounded-lg px-4 py-2 border border-outline-variant/15">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">calendar_today</span>
                <input className="bg-transparent border-none text-sm font-medium focus:ring-0 p-0 w-48" type="date" value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Surgeon</label>
              <select value={filters.medecin} onChange={(e) => setFilters({...filters, medecin: e.target.value})} className="bg-surface-container-lowest border-none rounded-lg px-4 py-2 text-sm font-medium border border-outline-variant/15 focus:ring-2 focus:ring-surface-tint/20 w-48">
                <option value="">Tous les chirurgiens</option>
                <option>Dr. Jean Dupont</option>
                <option>Dr. Marie Curie</option>
                <option>Dr. Alan Grant</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Type de Procédure</label>
              <select value={filters.procedure} onChange={(e) => setFilters({...filters, procedure: e.target.value})} className="bg-surface-container-lowest border-none rounded-lg px-4 py-2 text-sm font-medium border border-outline-variant/15 focus:ring-2 focus:ring-surface-tint/20 w-48">
                <option value="">Tous les types</option>
                <option value="Fibroscopie digestive haute">Fibroscopie digestive haute</option>
                <option value="Injection de colle biologique">Injection de colle biologique</option>
                <option value="Dilatation oesophagienne">Dilatation oesophagienne</option>
                <option value="Extraction de corps étranger">Extraction de corps étranger</option>
                <option value="Coloscopie">Coloscopie</option>
                <option value="Rectosigmoidoscopie">Rectosigmoidoscopie</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">DETAIL DE LA PRESCRIPTION</label>
              <div className="flex gap-2">
                <button onClick={() => setFilters({...filters, status: ""})} className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${!filters.status ? 'bg-primary text-white' : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/15'}`}>Tous</button>
                <button onClick={() => setFilters({...filters, status: "Validé"})} className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${filters.status === 'Validé' ? 'bg-primary text-white' : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/15'}`}>Validé</button>
              </div>
            </div>
            <button 
              onClick={handleResetFilters}
              disabled={isResetting}
              className="ml-auto flex items-center gap-2 text-primary font-bold text-sm px-4 py-2.5 rounded-lg transition-all duration-300 hover:bg-primary/10 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <span className={`material-symbols-outlined transition-transform duration-500 ${isResetting ? 'animate-spin' : 'group-hover:rotate-180'}`}>
                filter_list_off
              </span>
              <span className={`transition-all ${isResetting ? 'opacity-60' : ''}`}>
                {isResetting ? 'Réinitialisation...' : 'Réinitialiser les filtres'}
              </span>
            </button>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center px-4">
              <h4 className="font-headline font-bold text-on-surface">Rapports Cliniques ({/*filtered*/} {reports.filter(r => {
                const matchesNom = (r.name || "").toLowerCase().includes((filters.nom || "").toLowerCase());
                const matchesProcedure = !filters.procedure || (r.procedure || "").toLowerCase() === filters.procedure.toLowerCase();
                const matchesMedecin = (r.surgeon || "").toLowerCase().includes((filters.medecin || "").toLowerCase());
                const matchesDate = !filters.date || r.dateISO === filters.date || r.date === new Date(filters.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
                const matchesStatus = !filters.status || r.status === filters.status;
                return matchesNom && matchesProcedure && matchesMedecin && matchesDate && matchesStatus;
              }).length})</h4>
              <div className="flex items-center gap-4 text-xs font-bold text-on-surface-variant">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-tertiary" /> En attente de validation</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Finalisé</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/50">
                      <th className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Date</th>
                      <th className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">ID Patient</th>
                      <th className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Nom du Patient</th>
                      <th className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Type de Procédure</th>
                      <th className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Chirurgien</th>
                      <th className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">DETAIL DE LA PRESCRIPTION</th>
                      <th className="px-6 py-2.5 text-right" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {reports.filter(r => {
                      const matchesNom = (r.name || "").toLowerCase().includes((filters.nom || "").toLowerCase());
                      const matchesProcedure = !filters.procedure || (r.procedure || "").toLowerCase() === filters.procedure.toLowerCase();
                      const matchesMedecin = (r.surgeon || "").toLowerCase().includes((filters.medecin || "").toLowerCase());
                      const matchesDate = !filters.date || r.date === new Date(filters.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
                      const matchesStatus = !filters.status || r.status === filters.status;
                      return matchesNom && matchesProcedure && matchesMedecin && matchesDate && matchesStatus;
                    }).map((report) => (
                      <tr key={report.id} className="hover:bg-surface-container-high/30 transition-colors group">
                        <td className="px-6 py-2.5">
                          <p className="text-sm font-semibold text-on-surface">{report.date}</p>
                          <p className="text-[10px] text-on-surface-variant">{report.time}</p>
                        </td>
                        <td className="px-6 py-2.5 text-sm font-mono text-on-surface-variant">{report.id}</td>
                        <td className="px-6 py-2.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-xs font-bold">
                              {report.name.split(" ")[0][0]}{report.name.split(" ")[1][0]}
                            </div>
                            <span className="text-sm font-medium text-on-surface">{report.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-2.5">
                          <span className="px-3 py-1 bg-surface-container-highest rounded-full text-[11px] font-bold text-on-surface-variant">{report.procedure}</span>
                        </td>
                        <td className="px-6 py-2.5 text-sm text-on-surface">{report.surgeon}</td>
                        <td className="px-6 py-2.5">
                          <span className={`flex items-center gap-1.5 text-[11px] font-bold ${report.status === "Validé" ? "text-[#1e8e3e]" : "text-tertiary"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${report.status === "Validé" ? "bg-[#1e8e3e]" : "bg-tertiary"}`} />
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 text-right">
                          <button className="text-primary hover:text-primary-container font-bold text-xs uppercase tracking-wider flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            Voir détails
                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-2.5 bg-surface-container-low/30 border-t border-outline-variant/10 flex justify-between items-center">
                <p className="text-xs text-on-surface-variant font-medium">Affichage de 1-10 sur 1,284 dossiers</p>
                <div className="flex gap-2">
                  <button className="p-1 text-on-surface-variant hover:bg-surface-container-high rounded transition-colors disabled:opacity-30" disabled>
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button className="p-1 text-on-surface-variant hover:bg-surface-container-high rounded transition-colors">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

        <div className="fixed bottom-8 right-8 flex flex-col gap-3">
          <button className="w-12 h-12 rounded-full bg-surface-container-lowest border border-outline-variant/15 flex items-center justify-center text-on-surface-variant shadow-lg hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">sync</span>
          </button>
          <button className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-primary-container flex items-center justify-center text-white shadow-xl shadow-primary/30 hover:scale-110 transition-transform group">
            <span className="material-symbols-outlined text-2xl">file_upload</span>
            <span className="absolute right-full mr-4 bg-inverse-surface text-inverse-on-surface text-xs font-bold py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Importer DICOM
            </span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}
