import Image from "next/image";
import { AppShell } from "@/components/layout/AppShell";

const schedule = [
  {
    time: "08:30",
    patient: "Jean-Marc Bernard",
    id: "#END-9821",
    procedure: "Gastroscopie Diagnostique",
    doctor: "Dr. Durand",
    status: "En attente",
    statusClass: "bg-surface-container text-on-surface-variant",
  },
  {
    time: "09:15",
    patient: "Sophie Lefebvre",
    id: "#END-4423",
    procedure: "Coloscopie + Polypectomie",
    doctor: "Dr. Morel",
    status: "En cours",
    statusClass: "bg-blue-100 text-blue-800",
  },
  {
    time: "10:00",
    patient: "Robert Dubois",
    id: "#END-1290",
    procedure: "Echo-endoscopie",
    doctor: "Dr. Durand",
    status: "En attente",
    statusClass: "bg-surface-container text-on-surface-variant",
  },
  {
    time: "10:45",
    patient: "Helene Petit",
    id: "#END-5512",
    procedure: "Gastroscopie",
    doctor: "Dr. Morel",
    status: "En attente",
    statusClass: "bg-surface-container text-on-surface-variant",
  },
];

export default function Home() {
  return (
    <AppShell>
      <div className="pt-4 px-4 lg:px-8 max-w-7xl mx-auto space-y-8 pb-32">
        <div className="flex items-end justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 text-primary mb-3">
              <span className="material-symbols-outlined text-lg">waving_hand</span>
              <span className="text-lg font-semibold tracking-tight">Bonjour, Dr. Claire Durand</span>
            </div>
            <p className="text-on-surface-variant font-medium">
              Lundi 24 Mai • Unite d&#39;Endoscopie CHU ANDRAINJATO
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-4 bg-white p-6 rounded-xl border-none shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">clinical_notes</span>
              </div>
            </div>
            <div>
              <p className="text-on-surface-variant text-sm font-semibold mb-1">Total Procedures Aujourd&#39;hui</p>
              <h3 className="text-4xl font-extrabold text-on-surface">24</h3>
            </div>
            <div className="mt-6 flex items-center gap-2 text-emerald-600 text-xs font-bold">
              <span className="material-symbols-outlined text-sm">trending_up</span>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4 bg-white p-6 rounded-xl border-none shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-on-surface-variant text-sm font-semibold mb-1">CPA en attente</p>
                <h3 className="text-4xl font-extrabold text-on-surface">07</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-secondary-container/30 flex items-center justify-center text-on-secondary-container">
                <span className="material-symbols-outlined">assignment_late</span>
              </div>
            </div>
            <div className="mt-6">
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div className="bg-secondary w-2/3 h-full" />
              </div>
              <p className="mt-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">
                A valider
              </p>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4 text-on-primary p-6 rounded-xl border-none shadow-xl flex flex-col justify-between bg-[#DC2626] shadow-red-500/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-red-100 text-sm font-semibold mb-1">Urgences Actives</p>
                <h3 className="text-4xl font-extrabold">02</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined">emergency</span>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex -space-x-2">
                <Image
                  src="/assets/avatars/doctor-1.svg"
                  alt="Doctor 1"
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full border-2 object-cover border-[#DC2626]"
                />
                <Image
                  src="/assets/avatars/doctor-2.svg"
                  alt="Doctor 2"
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full border-2 object-cover border-[#DC2626]"
                />
              </div>
              <p className="text-xs font-medium">Equipe d&#39;intervention depechee</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
              <h4 className="font-headline text-xl font-bold">Planning du Jour</h4>
              <div className="flex gap-4 items-center">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant font-headline">
                    Date de debut
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                      calendar_today
                    </span>
                    <input
                      className="bg-surface-container border border-outline-variant/30 rounded-lg pl-10 pr-4 py-1.5 text-xs font-medium focus:ring-2 focus:ring-primary/20 text-on-surface font-headline"
                      type="date"
                      defaultValue="2024-05-24"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant font-headline">
                    Date de fin
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                      calendar_today
                    </span>
                    <input
                      className="bg-surface-container border border-outline-variant/30 rounded-lg pl-10 pr-4 py-1.5 text-xs font-medium focus:ring-2 focus:ring-primary/20 text-on-surface font-headline"
                      type="date"
                      defaultValue="2024-05-24"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      HEURE & PATIENT
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      PROCEDURE
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      MEDECIN
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      STATUT
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {schedule.map((item) => (
                    <tr key={`${item.time}-${item.id}`} className="hover:bg-surface-container-low transition-colors cursor-pointer">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-primary tabular-nums">{item.time}</span>
                          <div>
                            <p className="text-sm font-bold">{item.patient}</p>
                            <p className="text-[10px] text-on-surface-variant">ID: {item.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium">{item.procedure}</td>
                      <td className="px-6 py-5 text-sm text-on-surface-variant">{item.doctor}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${item.statusClass}`}
                          >
                            {item.status}
                          </span>
                          <button className="px-3 py-1 rounded-lg text-[10px] font-bold bg-primary/5 text-primary hover:bg-primary/10 transition-colors border border-primary/10">
                            Traiter
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="px-2">
              <h4 className="font-headline text-xl font-bold">Salle d&#39;endoscopie</h4>
              <p className="text-xs text-on-surface-variant">Statut en temps reel des salles d&#39;examen</p>
            </div>

            <div className="space-y-4">
              <div className="p-5 bg-white rounded-2xl shadow-sm border-l-4 border-emerald-500 cursor-pointer">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-on-surface">Salle ndeg01</span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Disponible</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant">cleaning_services</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-on-surface">Desinfection en cours</p>
                    <p className="text-[10px] text-on-surface-variant">Pret dans env. 4 min</p>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl shadow-sm border-l-4 border-primary cursor-pointer">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-on-surface">Salle ndeg02</span>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">En cours</span>
                </div>
                <div className="flex items-center gap-3">
                  <Image
                    src="/assets/illustrations/procedure.svg"
                    alt="Procedure"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold text-on-surface">Patient: Sophie L.</p>
                    <p className="text-[10px] text-on-surface-variant">Procedure: Polypectomie</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-surface-container rounded-full overflow-hidden">
                    <div className="bg-primary w-[75%] h-full" />
                  </div>
                  <span className="text-[10px] font-bold text-primary">EN COURS</span>
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl shadow-sm border-l-4 border-tertiary cursor-pointer">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-on-surface">Salle ndeg03</span>
                  <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Reserve</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center">
                    <span className="material-symbols-outlined text-tertiary">pending_actions</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-on-surface">Prevu pour 10h00</p>
                    <p className="text-[10px] text-on-surface-variant">Dr. Durand • Echo-endoscopie</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 z-50 group">
        <span className="material-symbols-outlined">add</span>
        <span className="absolute right-full mr-4 bg-on-surface text-white px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Nouvelle Admission
        </span>
      </button>
    </AppShell>
  );
}
