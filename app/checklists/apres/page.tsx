"use client";

import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { useRouter } from "next/navigation";
import { use, Suspense, useState, useEffect } from "react";
import { apiFetch, apiJson, apiUrl } from "@/lib/api";
import { usePatient } from "@/contexts/PatientContext";

const checklistItems = [
  {
    icon: "label",
    title: "Confirmation & Étiquetage",
    description: "Confirmation orale du nom de l'acte et étiquetage rigoureux des prélèvements.",
    buttons: ["OUI", "NON", "NA"],
  },
  {
    icon: "history_edu",
    title: "Prescriptions Post-Acte",
    description: "Saisie et vérification des prescriptions médicales pour la phase de réveil.",
    buttons: ["OUI", "NON"],
  },
];

function ChecklistApresContent() {
  const router = useRouter();
  const { patientId, prescriptionId, patientName, procedure } = usePatient();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remarques, setRemarques] = useState("");

  const titleToDbKey: Record<string, string> = {
    "Confirmation & Étiquetage": "confirmationEtiquetage",
    "Prescriptions Post-Acte": "prescriptionsPostActe",
  };

  useEffect(() => {
    async function loadData() {
      if (!prescriptionId) return;
      try {
        const data = await apiJson<any>(`/api/checklists/apres/${prescriptionId}`);
        if (data) {
          const mappedAnswers: Record<string, string> = {};
          Object.entries(titleToDbKey).forEach(([title, key]) => {
            if (data[key]) mappedAnswers[title] = data[key];
          });
          setAnswers(mappedAnswers);
          setRemarques(data.remarques || "");
        }
      } catch (err) {
        console.error("Erreur chargement checklist après:", err);
      }
    }
    loadData();
  }, [prescriptionId]);

  const saveChecklist = async (newAnswers: Record<string, string>, newRemarques: string) => {
    if (!prescriptionId || !patientId) return;

    const payload = {
      prescriptionId,
      patientId,
      confirmationEtiquetage: newAnswers["Confirmation & Étiquetage"] || null,
      prescriptionsPostActe: newAnswers["Prescriptions Post-Acte"] || null,
      remarques: newRemarques,
      estValide: Object.keys(titleToDbKey).every(title => !!newAnswers[title]),
    };

    try {
      await apiFetch('/api/checklists/apres', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
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
    saveChecklist(nextAnswers, remarques);
  };

  const handleRemarquesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRemarques(e.target.value);
  };

  const handleRemarquesBlur = () => {
    saveChecklist(answers, remarques);
  };

  const handleValiderEtTerminer = async () => {
    await saveChecklist(answers, remarques);
    router.push('/resultat-endoscopie');
  };

  return (
    <div className="bg-surface text-on-surface pb-24">
      <div className="flex justify-center pt-8 px-4">
        <div className="max-w-[56rem] w-full space-y-8">
          <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-primary-fixed rounded-xl flex items-center justify-center text-blue-900">
                <span className="material-symbols-outlined text-3xl">person</span>
              </div>
              <div>
                <h3 className="font-headline text-xl text-blue-900">{patientName}</h3>
                <p className="text-slate-500 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">fingerprint</span>
                  ID: {patientId}
                </p>
              </div>
            </div>
            <div className="text-right px-4 py-2 bg-surface-container-low rounded-lg border-l-4 border-blue-700">
              <p className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">Type d'examen</p>
              <p className="font-bold text-on-surface">{procedure}</p>
            </div>
          </section>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <h2 className="font-headline text-blue-900 text-xl text-center px-4">2. APRÈS L'ENDOSCOPIE</h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {checklistItems.map((item, index) => (
              <div key={item.title} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-secondary-container rounded-lg">
                    <span className="material-symbols-outlined text-on-secondary-fixed-variant">{item.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-headline text-on-surface">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {item.buttons.map((button) => {
                    const isSelected = answers[item.title] === button;
                    return (
                      <button
                        key={button}
                        onClick={() => updateAnswer(item.title, button)}
                        className={`flex-1 py-3 text-center rounded-lg border transition-all font-medium ${
                          isSelected
                            ? "bg-primary-container text-white border-primary-container shadow-sm"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {button}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="md:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-surface-container-low rounded-lg">
                  <span className="material-symbols-outlined text-slate-600">rate_review</span>
                </div>
                <h4 className="font-headline text-on-surface">Remarques ou écarts constatés</h4>
              </div>
              <textarea
                value={remarques}
                onChange={handleRemarquesChange}
                onBlur={handleRemarquesBlur}
                className="w-full bg-surface-container-low border-0 border-b-2 border-slate-200 focus:border-blue-900 focus:ring-0 rounded-t-lg text-sm transition-all"
                placeholder="Décrivez d'éventuelles complications, anomalies ou notes cliniques importantes..."
                rows={4}
              />
            </div>
          </div>
        </div>
      </div>

      <footer className="fixed bottom-0 right-0 w-[calc(100%-16rem)] bg-white border-t border-slate-200 p-4 shadow-xl z-50">
        <div className="max-w-[896px] mx-auto flex items-center justify-end">

          <button
            onClick={async () => {
              await saveChecklist(answers, remarques);
              router.push('/prescription-workflow');
            }}
            className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 hover:bg-slate-50 mr-4"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Retour à l'opération
          </button>
          <button onClick={handleValiderEtTerminer} className="px-8 py-3 bg-gradient-to-r from-[#00478D] to-[#005EB8] text-white rounded-xl shadow-lg shadow-blue-900/20 font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 hover:opacity-90">
            Valider et Terminer
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default function ChecklistApresPage() {
  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        <Suspense fallback={<div className="py-8 text-center text-slate-500 font-bold uppercase tracking-widest">Chargement de la check-list...</div>}>
          <ChecklistApresContent />
        </Suspense>
      </div>
    </AppShell>
  );
}
