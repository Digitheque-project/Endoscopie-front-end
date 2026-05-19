import { AppShell } from "@/components/layout/AppShell";

const reports = [
  {
    name: "LEFEBVRE Sophie",
    id: "#END-2023-9942",
    procedure: "Colonoscopy + Biopsy",
    surgeon: "Dr. Jean Dupont",
    status: "Brouillon",
    statusClass: "bg-tertiary-fixed text-on-tertiary-fixed",
    date: "12 Oct 2023",
    time: "09:45",
  },
  {
    name: "MARCHAND Thomas",
    id: "#END-2023-9938",
    procedure: "Upper Endoscopy",
    surgeon: "Dr. Claire Durand",
    status: "Validé",
    statusClass: "bg-green-100 text-green-700",
    date: "12 Oct 2023",
    time: "08:15",
  },
  {
    name: "PETIT Robert",
    id: "#END-2023-9930",
    procedure: "Sigmoidoscopy",
    surgeon: "Dr. Marie Curie",
    status: "Validé",
    statusClass: "bg-green-100 text-green-700",
    date: "11 Oct 2023",
    time: "16:30",
  },
];

export default function RapportPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-surface">
        <div className="px-8 py-6 space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/5 flex items-center justify-between">
              <div>
                <p className="text-sm text-on-surface-variant font-medium mb-1">Procédures Aujourd'hui</p>
                <h3 className="text-3xl font-headline font-bold text-on-surface">14</h3>
                <p className="text-xs text-[#1e8e3e] font-bold flex items-center gap-1 mt-2"><span className="material-symbols-outlined text-sm">trending_up</span> +12% vs hier</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">medical_information</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/5 flex items-center justify-between">
              <div>
                <p className="text-sm text-on-surface-variant font-medium mb-1">Taux de réussite</p>
                <h3 className="text-3xl font-headline font-bold text-on-surface">99.2%</h3>
                <p className="text-xs text-on-surface-variant font-medium mt-2">Moyenne historique: 98.4%</p>
              </div>
              <div className="w-12 h-12 bg-secondary-container/30 rounded-full flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined">verified</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/5 flex items-center justify-between">
              <div>
                <p className="text-sm text-on-surface-variant font-medium mb-1">Durée Moyenne</p>
                <h3 className="text-3xl font-headline font-bold text-on-surface">24m 15s</h3>
                <p className="text-xs text-tertiary font-bold flex items-center gap-1 mt-2"><span className="material-symbols-outlined text-sm">schedule</span> -2 min depuis la semaine dernière</p>
              </div>
              <div className="w-12 h-12 bg-tertiary-fixed/30 rounded-full flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined">hourglass_top</span>
              </div>
            </div>
          </section>

          <section className="flex flex-wrap items-end gap-6 bg-surface-container-low p-6 rounded-xl">
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Date Range</label>
              <div className="flex items-center gap-2 bg-surface-container-lowest rounded-lg px-4 py-2 border border-outline-variant/15">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">calendar_today</span>
                <input className="bg-transparent border-none text-sm font-medium focus:ring-0 p-0 w-48" type="text" defaultValue="Oct 12, 2023 - Oct 19, 2023" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Surgeon</label>
              <select className="bg-surface-container-lowest border-none rounded-lg px-4 py-2 text-sm font-medium border border-outline-variant/15 focus:ring-2 focus:ring-surface-tint/20 w-48">
                <option>Tous les chirurgiens</option>
                <option>Dr. Jean Dupont</option>
                <option>Dr. Marie Curie</option>
                <option>Dr. Alan Grant</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">DETAIL DE LA PRESCRIPTION</label>
              <div className="flex gap-2">
                <button className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-full transition-all">Tous</button>
                <button className="bg-surface-container-lowest text-on-surface-variant hover:text-primary text-xs font-bold px-4 py-2 rounded-full border border-outline-variant/15 transition-all">Brouillon</button>
                <button className="bg-surface-container-lowest text-on-surface-variant hover:text-primary text-xs font-bold px-4 py-2 rounded-full border border-outline-variant/15 transition-all">Validé</button>
              </div>
            </div>
            <button className="ml-auto flex items-center gap-2 text-primary font-bold text-sm hover:underline decoration-2 underline-offset-4">
              <span className="material-symbols-outlined">filter_list_off</span>
              Réinitialiser les filtres
            </button>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center px-4">
              <h4 className="font-headline font-bold text-on-surface">Rapports Cliniques (24)</h4>
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
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Date</th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">ID Patient</th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Nom du Patient</th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Type de Procédure</th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Chirurgien</th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">DETAIL DE LA PRESCRIPTION</th>
                      <th className="px-6 py-4 text-right" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-surface-container-high/30 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-on-surface">{report.date}</p>
                          <p className="text-[10px] text-on-surface-variant">{report.time}</p>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-on-surface-variant">{report.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-xs font-bold">
                              {report.name.split(" ")[0][0]}{report.name.split(" ")[1][0]}
                            </div>
                            <span className="text-sm font-medium text-on-surface">{report.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-surface-container-highest rounded-full text-[11px] font-bold text-on-surface-variant">{report.procedure}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface">{report.surgeon}</td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-1.5 text-[11px] font-bold ${report.status === "Validé" ? "text-[#1e8e3e]" : "text-tertiary"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${report.status === "Validé" ? "bg-[#1e8e3e]" : "bg-tertiary"}`} />
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
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

              <div className="px-6 py-4 bg-surface-container-low/30 border-t border-outline-variant/10 flex justify-between items-center">
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
        </div>

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
