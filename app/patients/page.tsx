"use client";

import { AppShell } from "@/components/layout/AppShell";

const patients = [
  {
    id: "#END-2023-8902",
    name: "MARIE-LOUISE Dupont",
    initials: "ML",
    age: 64,
    gender: "Femme",
    exam: "Coloscopie",
    examClass: "bg-blue-100 text-blue-800",
    time: "08:30",
    status: "Terminé",
    statusColor: "text-green-700",
    dotColor: "bg-green-500",
  },
  {
    id: "#END-2023-9011",
    name: "JEAN-RENE Bernard",
    initials: "JR",
    age: 52,
    gender: "Homme",
    exam: "Gastroscopie",
    examClass: "bg-purple-100 text-purple-800",
    time: "09:45",
    status: "En cours",
    statusColor: "text-blue-700",
    dotColor: "bg-blue-500",
    pulse: true,
  },
  {
    id: "#END-2023-9015",
    name: "SOPHIE Morel",
    initials: "SM",
    age: 41,
    gender: "Femme",
    exam: "Coloscopie",
    examClass: "bg-blue-100 text-blue-800",
    time: "11:00",
    status: "En attente",
    statusColor: "text-orange-700",
    dotColor: "bg-orange-400",
    focused: true,
  },
  {
    id: "#END-2023-9022",
    name: "ALAIN Herbert",
    initials: "AH",
    age: 76,
    gender: "Homme",
    exam: "Coloscopie",
    examClass: "bg-blue-100 text-blue-800",
    time: "11:45",
    status: "En attente",
    statusColor: "text-orange-700",
    dotColor: "bg-orange-400",
  },
];

export default function PatientsPage() {
  return (
    <AppShell>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-headline font-extrabold tracking-tight">Liste des Patients</h1>
          <p className="text-on-surface-variant mt-1">Programmation du jour - Endoscopie</p>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex-1 min-w-[140px]">
            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">TOTAL AUJOURD'HUI</p>
            <p className="text-2xl font-headline font-extrabold text-blue-900">12</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex-1 min-w-[140px]">
            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">EN ATTENTE</p>
            <p className="text-2xl font-headline font-extrabold text-orange-600">5</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex-1 min-w-[140px]">
            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">EN COURS</p>
            <p className="text-2xl font-headline font-extrabold text-blue-600">2</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex-1 min-w-[140px]">
            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">TERMINÉ</p>
            <p className="text-2xl font-headline font-extrabold text-green-600">5</p>
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-headline font-bold text-blue-900">Programmation du Jour</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-white transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">filter_list</span> Filtrer
              </button>
              <button className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-white transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">download</span> Exporter
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Nom du Patient</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">ID Patient</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Type d'Examen</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Heure prévue</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Statut</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {patients.map((patient) => (
                  <tr
                    key={patient.id}
                    className={`hover:bg-blue-50/30 transition-colors ${patient.focused ? "bg-blue-50/10" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <a href="/patient-dossier" className="flex items-center gap-3 group">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          patient.initials === "ML" ? "bg-blue-100 text-blue-800" :
                          patient.initials === "JR" ? "bg-orange-100 text-orange-800" :
                          "bg-slate-200 text-slate-600"
                        }`}>
                          {patient.initials}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors">{patient.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {patient.age} ans • {patient.gender}
                          </p>
                        </div>
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-500">{patient.id}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 ${patient.examClass} text-[10px] font-bold rounded uppercase tracking-wider`}>
                        {patient.exam}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700 text-center">{patient.time}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${patient.dotColor} ${patient.pulse ? "animate-pulse" : ""}`}></div>
                        <span className={`text-xs font-semibold ${patient.statusColor}`}>{patient.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {patient.focused && (
                          <a
                            href="/checklists/avant"
                            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[10px] px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all font-bold flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[14px]">playlist_add_check</span> Démarrer check-list
                          </a>
                        )}
                        <button className="p-2 text-blue-900 hover:bg-blue-100 rounded-lg transition-all" title="Voir dossier">
                          <span className="material-symbols-outlined">folder_shared</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">Affichage de 4 patients sur 12 au total</p>
            <div className="flex items-center gap-2">
              <button className="p-1 text-slate-400 hover:text-blue-900">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <div className="flex gap-1">
                <span className="w-6 h-6 flex items-center justify-center text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded">1</span>
                <span className="w-6 h-6 flex items-center justify-center text-xs font-medium text-slate-400 rounded hover:bg-slate-100 cursor-pointer">2</span>
                <span className="w-6 h-6 flex items-center justify-center text-xs font-medium text-slate-400 rounded hover:bg-slate-100 cursor-pointer">3</span>
              </div>
              <button className="p-1 text-slate-400 hover:text-blue-900">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alerts & Capacity */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-headline font-bold text-blue-900 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500">warning</span> Alertes de préparation
              </h4>
              <p className="text-sm text-slate-500 mb-4 max-w-md">3 patients présentent une préparation incomplète ou des contre-indications signalées lors du pré-accueil.</p>
              <div className="flex gap-3">
                <div className="px-4 py-2 bg-orange-50 rounded-lg border border-orange-100">
                  <p className="text-[10px] font-bold text-orange-800 uppercase tracking-wider mb-1">M. Alain Herbert</p>
                  <p className="text-xs text-orange-600">Préparation hydrique insuffisante.</p>
                </div>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10">
              <span className="material-symbols-outlined text-[120px]">clinical_notes</span>
            </div>
          </div>
          <div className="col-span-4 bg-gradient-to-r from-primary to-primary-container p-6 rounded-xl shadow-xl flex flex-col justify-between text-white relative">
            <div className="relative z-10">
              <h4 className="font-headline font-bold">Capacité du bloc</h4>
              <p className="text-xs text-white/80">Occupation actuelle : 75%</p>
            </div>
            <div className="mt-4 relative z-10">
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                <div className="bg-white h-full w-3/4 rounded-full"></div>
              </div>
            </div>
            <button className="mt-6 w-full py-2 bg-white text-primary font-bold text-xs rounded-lg hover:bg-surface-bright transition-all active:scale-95">
              Optimiser l'agenda
            </button>
          </div>
        </div>
      </div>

      {/* FAB */}
      <div className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-primary to-primary-container text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-90 z-50 group cursor-pointer">
        <span className="material-symbols-outlined">add</span>
        <span className="absolute right-full mr-4 bg-blue-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
          Ajouter un Patient
        </span>
      </div>
    </AppShell>
  );
}
