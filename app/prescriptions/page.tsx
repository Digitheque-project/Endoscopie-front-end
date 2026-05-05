import { AppShell } from "@/components/layout/AppShell";

const urgentRequests = [
  {
    patient: "MARIE LEFEBVRE",
    id: "#END-29402",
    procedure: "Gastroscopie Diagnostique",
    prescriber: "Dr. Antoine Moreau",
    reason: "Hemorragie digestive haute",
    received: "Reçu il y a 14 minutes",
    badge: "STAT",
    accent: "border-error",
    badgeClass: "bg-error text-white",
  },
  {
    patient: "JEAN-PIERRE DUBOIS",
    id: "#END-29405",
    procedure: "Colonoscopie de depistage",
    prescriber: "Dr. Elena Rossi",
    reason: "Suspicion de polype (TIF+)",
    received: "Reçu il y a 2 heures",
    badge: "URGENT",
    accent: "border-tertiary",
    badgeClass: "bg-tertiary text-white",
  },
  {
    patient: "SOPHIE MARTIN",
    id: "#END-29388",
    procedure: "Echo-endoscopie",
    prescriber: "Dr. Julian Reed",
    reason: "Suivi lésion pancréatique",
    received: "Reçu hier",
    badge: "NORMAL",
    accent: "border-outline-variant",
    badgeClass: "bg-surface-container-highest text-on-surface-variant",
  },
];

export default function PrescriptionsPage() {
  return (
    <AppShell>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">Fil de prescription</h1>
            <p className="text-on-surface-variant mt-1">Gérer les demandes d'endoscopie en attente de planification.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-surface-container text-on-surface font-semibold rounded-lg flex items-center gap-2 border border-outline-variant/10">
              <span className="material-symbols-outlined text-lg">filter_list</span>
              Filtrer
            </button>
            <button className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">sync</span>
              Actualiser
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm border border-outline-variant/5">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total En attente</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-headline font-extrabold text-primary">24</span>
              <span className="text-xs text-error font-semibold">+3 aujourd'hui</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm border border-outline-variant/5">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Urgences (STAT)</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-headline font-extrabold text-tertiary">04</span>
              <span className="text-xs text-on-surface-variant font-medium">Priorité immédiate</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm border border-outline-variant/5">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Salles Disponibles</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-headline font-extrabold text-secondary">02</span>
              <span className="text-xs text-on-surface-variant font-medium">Salle 4 &amp; 5</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <h3 className="font-headline font-bold text-lg flex items-center gap-2">
              <span className="w-2 h-6 bg-error rounded-full" />
              Demandes Prioritaires
            </h3>

            {urgentRequests.map((request) => (
              <div key={request.id} className={`bg-surface-container-lowest p-6 rounded-lg border-l-4 ${request.accent} shadow-sm hover:shadow-md transition-shadow`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div
                      className={`w-12 h-12 rounded-full ${
                        request.badge === "URGENT"
                          ? "bg-tertiary-fixed text-on-tertiary-fixed"
                          : request.badge === "NORMAL"
                            ? "bg-surface-container text-on-surface-variant"
                            : "bg-error-container text-on-error-container"
                      } flex items-center justify-center`}
                    >
                      <span className="material-symbols-outlined">
                        {request.badge === "NORMAL" ? "person" : request.badge === "URGENT" ? "clinical_notes" : "priority_high"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-on-surface leading-tight">{request.patient}</h4>
                      <p className="text-sm text-on-surface-variant font-mono">ID: {request.id}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 ${request.badgeClass} text-[10px] font-bold rounded-full uppercase tracking-tighter`}>
                    {request.badge}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-y border-outline-variant/10">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant">Procédure</p>
                    <p className="text-sm font-semibold text-primary">{request.procedure}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant">Prescripteur</p>
                    <p className="text-sm font-semibold">{request.prescriber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant">Motif</p>
                    <p className="text-sm font-semibold truncate">{request.reason}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <p className="text-xs text-on-surface-variant italic flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">schedule</span>
                    {request.received}
                  </p>
                  <div className="flex gap-2">
                    <button className="px-4 py-1.5 text-xs font-bold text-secondary hover:bg-secondary-container/20 rounded-lg transition-colors border border-secondary/20">
                      Traiter
                    </button>
                    <button className="px-4 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors">
                      Détails
                    </button>
                    <button className="px-4 py-1.5 text-xs font-bold bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
                      Planifier
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant/20">
              <h3 className="font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">calendar_today</span>
                Agenda du Jour
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3 pl-3 border-l-2 border-primary-container">
                  <span className="text-xs font-bold text-on-surface-variant min-w-[45px]">09:00</span>
                  <div>
                    <p className="text-sm font-bold text-on-surface">Gastroscopie - Salle 1</p>
                    <p className="text-[11px] text-on-surface-variant">Patient: R. Durand</p>
                  </div>
                </div>
                <div className="flex gap-3 pl-3 border-l-2 border-primary-container">
                  <span className="text-xs font-bold text-on-surface-variant min-w-[45px]">10:30</span>
                  <div>
                    <p className="text-sm font-bold text-on-surface">Colonoscopie - Salle 2</p>
                    <p className="text-[11px] text-on-surface-variant">Patient: L. Bernard</p>
                  </div>
                </div>
                <div className="flex gap-3 pl-3 border-l-2 border-primary p-2 rounded-r-lg bg-secondary-container/20 shadow-sm">
                  <span className="text-xs font-bold text-primary min-w-[45px]">11:45</span>
                  <div>
                    <p className="text-sm font-bold text-on-surface">URGENCE STAT - Salle 1</p>
                    <p className="text-[11px] text-on-surface-variant">En attente de patient</p>
                  </div>
                </div>
              </div>
              <button className="w-full mt-6 py-2 border border-primary text-primary text-xs font-bold rounded hover:bg-primary/5 transition-colors uppercase">
                Voir l'agenda complet
              </button>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/5">
              <h3 className="font-headline font-bold text-on-surface mb-4">Activité Récente</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">task_alt</span>
                  </div>
                  <div>
                    <p className="text-xs"><span className="font-bold">Rapport validé</span> pour Patient ID #8829</p>
                    <p className="text-[10px] text-on-surface-variant">Il y a 10 min par Dr. Reed</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">mail</span>
                  </div>
                  <div>
                    <p className="text-xs"><span className="font-bold">Nouvelle prescription</span> - Gastroscopie</p>
                    <p className="text-[10px] text-on-surface-variant">Il y a 14 min par Dr. Moreau</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-error-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">cancel</span>
                  </div>
                  <div>
                    <p className="text-xs"><span className="font-bold">RDV Annulé</span> - Patient S. Girard</p>
                    <p className="text-[10px] text-on-surface-variant">Il y a 45 min</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <a className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-primary to-primary-container text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-50 group" href="/">
          <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
        </a>
      </div>
    </AppShell>
  );
}
