import { AppShell } from "@/components/layout/AppShell";

const checklistItems = [
  {
    icon: "how_to_reg",
    title: "Identite du patient verifiee",
    buttons: ["OUI", "NON"],
    primary: true,
  },
  {
    icon: "medical_information",
    title: "Type d'endoscopie confirme",
    buttons: ["OUI", "NON"],
    primary: true,
  },
  {
    icon: "inventory",
    title: "Materiel dispo. (Endo/Anesth)",
    buttons: ["OUI", "NON"],
  },
  {
    icon: "report_problem",
    title: "Risques (Allergie, Intub, Saignement)",
    buttons: ["OUI", "NON"],
    danger: true,
  },
  {
    icon: "no_meals",
    title: "Patient a jeun",
    buttons: ["OUI", "NON"],
    primary: true,
  },
  {
    icon: "sanitizer",
    title: "Preparation adequate",
    buttons: ["OUI", "NON"],
  },
  {
    icon: "medication",
    title: "Traitement Anticoagulants",
    buttons: ["OUI", "NON", "N/A"],
  },
  {
    icon: "vaccines",
    title: "Antibioprophylaxie",
    buttons: ["OUI", "NON", "N/A"],
  },
  {
    icon: "checkroom",
    title: "Tenue du patient",
    buttons: ["OUI", "NON"],
  },
];

export default function ChecklistAvantPage() {
  return (
    <AppShell>
      <div className="min-h-[1024px] bg-surface text-on-surface">
        <main className="lg:ml-64 pt-24 pb-32 px-4 lg:px-8 flex justify-center">
          <div className="max-w-[56rem] w-full space-y-8">
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-primary-fixed-variant">person</span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Patient</p>
                    <h2 className="font-headline text-xl text-blue-900">DUBOIS, Jean-Pierre</h2>
                    <p className="text-sm text-slate-600">Né le 14/05/1958 (65 ans)</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Procédure</p>
                    <p className="text-sm font-semibold text-slate-800">Coloscopie diagnostique</p>
                    <p className="text-sm text-slate-600">Date : 24/10/2023</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Service</p>
                    <p className="text-sm text-slate-800">Gastro-entérologie - Bloc B</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Equipe</p>
                    <div className="flex flex-col gap-1 text-sm text-slate-800">
                      <span><b>Anesthésiste:</b> Dr. Morel</span>
                      <span><b>IADE:</b> M. Lucas</span>
                      <span><b>Coord:</b> Mme. Faure</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold">1</span>
                <h3 className="font-headline text-xl text-blue-900">1. AVANT L'ENDOSCOPIE</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {checklistItems.map((item) => (
                  <div key={item.title} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3 mb-4">
                      <span className={`material-symbols-outlined ${item.danger ? "text-error" : "text-blue-700"}`}>{item.icon}</span>
                      <span className="text-sm font-medium text-slate-800">{item.title}</span>
                    </div>
                    <div className={`flex gap-2 ${item.buttons.length === 3 ? "gap-1" : ""}`}>
                      {item.buttons.map((label, index) => (
                        <button
                          key={label}
                          className={[
                            "flex-1 py-2 text-center rounded-lg border text-sm font-semibold transition-all",
                            index === 0 && item.primary
                              ? "border-primary-container bg-primary-container text-white"
                              : index === 1 && item.danger
                                ? "border-error bg-error text-white"
                                : index === 2
                                  ? "border-slate-200 bg-primary-container text-white text-xs"
                                  : "border-slate-200 text-slate-600 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>

        <footer className="fixed bottom-0 right-0 w-[calc(100%-16rem)] bg-white border-t border-slate-200 p-4 shadow-xl z-50">
          <div className="max-w-[896px] mx-auto flex items-center justify-between">
            <div className="flex-1 mr-12">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">Progression de la checklist</span>
                <span className="text-xs font-bold text-blue-900">33% (PHASE 1/3)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#00478D] to-[#005EB8] w-1/3 rounded-full" />
              </div>
            </div>

            <a href="/prescriptions" className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95 mr-4">
              <span className="material-symbols-outlined">arrow_back</span>
              Retour au fil de prescription
            </a>
            <a href="/checklists/apres" className="px-8 py-3 bg-gradient-to-r from-[#00478D] to-[#005EB8] text-white rounded-xl shadow-lg shadow-blue-900/20 font-semibold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all">
              Passer à la phase suivante
              <span className="material-symbols-outlined">arrow_forward</span>
            </a>
          </div>
        </footer>
      </div>
    </AppShell>
  );
}
