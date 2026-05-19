"use client";

import { useState, useEffect, use, Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useRouter } from "next/navigation";
import WorkflowProgressIndicator from "@/components/workflow/WorkflowProgressIndicator";
import { API_BASE_URL } from "@/lib/api";

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
    icon: "groups",
    title: "Validation collégiale clinique",
    buttons: ["OUI", "NON"],
  },
  {
    icon: "medication",
    title: "Gestion des antiagrégants/anticoagulants",
    buttons: ["OUI", "NON", "NA"],
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

function ChecklistAvantContent({ searchParams }: { searchParams: Promise<any> }) {
  const resolvedParams = use(searchParams);
  const patientName = resolvedParams?.patient ?? "DUBOIS, Jean-Pierre";
  const patientId = resolvedParams?.patientId ?? "";
  const prescriptionId = resolvedParams?.prescriptionId ?? "";
  const rendezVousId = resolvedParams?.rendezVousId ?? "";
  const procedure = resolvedParams?.procedure ?? "Coloscopie diagnostique";

  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const titleToDbKey: Record<string, string> = {
    "Identite du patient verifiee": "identiteVerifiee",
    "Type d'endoscopie confirme": "procedureConfirmee",
    "Materiel dispo. (Endo/Anesth)": "materielDisponible",
    "Risques (Allergie, Intub, Saignement)": "risquesVerifies",
    "Patient a jeun": "jeuneRespecte",
    "Preparation adequate": "preparationAdequate",
    "Validation collégiale clinique": "validationCollegiale",
    "Gestion des antiagrégants/anticoagulants": "anticoagulantsArretes",
    "Antibioprophylaxie": "antibioprophylaxie",
    "Tenue du patient": "tenueAppropriee",
  };

  useEffect(() => {
    async function loadData() {
      if (!prescriptionId) {
        setIsLoading(false);
        return;
      }
      try {
        const resp = await fetch(`${API_BASE_URL}/api/checklists/avant/${prescriptionId}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data) {
            const mappedAnswers: Record<string, string> = {};
            Object.entries(titleToDbKey).forEach(([title, key]) => {
              if (data[key] === true) mappedAnswers[title] = "OUI";
              else if (data[key] === false) mappedAnswers[title] = "NON";
            });
            setAnswers(mappedAnswers);
          }
        }
      } catch (err) {
        console.error("Erreur lors du chargement de la checklist:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [prescriptionId]);

  const saveChecklist = async (newAnswers: Record<string, string>) => {
    if (!prescriptionId || !patientId) {
      console.error("Impossible de sauvegarder: identifiants manquants", { prescriptionId, patientId });
      return;
    }

    const payload: any = {
      prescriptionId: prescriptionId,
      rendezVousId: rendezVousId || null,
      patientId: patientId,
      identiteVerifiee: newAnswers["Identite du patient verifiee"] === "OUI",
      procedureConfirmee: newAnswers["Type d'endoscopie confirme"] === "OUI",
      materielDisponible: newAnswers["Materiel dispo. (Endo/Anesth)"] === "OUI",
      risquesVerifies: newAnswers["Risques (Allergie, Intub, Saignement)"] === "OUI",
      jeuneRespecte: newAnswers["Patient a jeun"] === "OUI",
      preparationAdequate: newAnswers["Preparation adequate"] === "OUI",
      validationCollegiale: newAnswers["Validation collégiale clinique"] === "OUI",
      anticoagulantsArretes: newAnswers["Gestion des antiagrégants/anticoagulants"] === "OUI",
      antibioprophylaxie: newAnswers["Antibioprophylaxie"] === "OUI",
      tenueAppropriee: newAnswers["Tenue du patient"] === "OUI",
      estValide: Object.keys(titleToDbKey).every(title => newAnswers[title] === "OUI"),
    };

    try {
      const resp = await fetch(`${API_BASE_URL}/api/checklists/avant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const errorData = await resp.json();
        console.error("Erreur serveur lors de la sauvegarde:", errorData);
      }
    } catch (err) {
      console.error("Erreur réseau lors de la sauvegarde:", err);
    }
  };

  const updateAnswer = (itemTitle: string, selected: string) => {
    const isSameSelection = answers[itemTitle] === selected;
    const nextAnswers = {
      ...answers,
      [itemTitle]: isSameSelection ? "" : selected,
    };

    if (isSameSelection) {
      delete nextAnswers[itemTitle];
    }

    setAnswers(nextAnswers);
    saveChecklist(nextAnswers);
  };

  const handleRetourWorkflow = () => {
    router.push('/');
  };

  return (
    <div className="min-h-[1024px] bg-surface text-on-surface">
      <div className="pt-8 pb-24 px-4 flex justify-center">
        <div className="max-w-[56rem] w-full space-y-4">
          <WorkflowProgressIndicator />
          <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary-fixed-variant">person</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Patient</p>
                  <h2 className="font-headline text-xl text-blue-900">{patientName}</h2>
                  <p className="text-sm text-slate-600">ID: {patientId}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Procédure</p>
                    <p className="text-sm font-semibold text-slate-800">{procedure}</p>
                  <p className="text-sm text-slate-600">Date : 24/10/2023</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Service</p>
                  <p className="text-sm text-slate-800">Gastro-entérologie - Salle1</p>
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

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold">1</span>
              <h3 className="font-headline text-xl text-blue-900">1. AVANT L'ENDOSCOPIE</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checklistItems.map((item) => (
                <div key={item.title} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-2">
                    <span className={`material-symbols-outlined ${item.danger ? "text-error" : "text-blue-700"}`}>{item.icon}</span>
                    <span className="text-sm font-medium text-slate-800">{item.title}</span>
                  </div>
                  <div className={`flex gap-2 ${item.buttons.length === 3 ? "gap-1" : ""}`}>
                    {item.buttons.map((label) => {
                      const isSelected = answers[item.title] === label;
                      let buttonColorClass = "border-slate-200 text-slate-600 bg-white hover:bg-slate-50";

                      if (isSelected) {
                        if (item.danger) {
                          if (label === "OUI") buttonColorClass = "border-red-500 bg-red-500 text-white shadow-md shadow-red-500/20";
                          else if (label === "NON") buttonColorClass = "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/20";
                        } else {
                          if (label === "OUI") buttonColorClass = "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20";
                          else if (label === "NON") buttonColorClass = "border-slate-500 bg-slate-500 text-white shadow-md shadow-slate-500/20";
                          else if (label === "N/A" || label === "NA") buttonColorClass = "border-slate-600 bg-slate-600 text-white shadow-md shadow-slate-600/20";
                        }
                      }

                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => updateAnswer(item.title, label)}
                          className={`flex-1 py-1.5 text-center rounded-lg border text-sm font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 ${buttonColorClass}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

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

          <button onClick={handleRetourWorkflow} className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 hover:bg-slate-50 mr-4">
            <span className="material-symbols-outlined">arrow_back</span>
            Retour au fil de prescription
          </button>
          <button 
            onClick={async () => {
              await saveChecklist(answers);
              router.push('/prescription-workflow');
            }} 
            className="px-8 py-3 bg-gradient-to-r from-[#00478D] to-[#005EB8] text-white rounded-xl shadow-lg shadow-blue-900/20 font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 hover:opacity-90"
          >
            Passer à l'opération
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default function ChecklistAvantPage(props: { searchParams: Promise<any> }) {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest">Chargement des données...</div>}>
        <ChecklistAvantContent {...props} />
      </Suspense>
    </AppShell>
  );
}
