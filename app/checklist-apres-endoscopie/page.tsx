"use client";

import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, apiJson } from "@/lib/api";
import { usePatient } from "@/contexts/PatientContext";

const ETIQUETAGE_OPTIONS: [string, string][] = [
  ["Oui", "OUI"],
  ["Non", "NON"],
  ["N/A", "NA"],
];

const PRESCRIPTIONS_OPTIONS: [string, string][] = [
  ["Oui", "OUI"],
  ["Non", "NON"],
];

function ChecklistApresEndoscopieContent() {
  const router = useRouter();
  const { patientId, prescriptionId, patientName, procedure } = usePatient();

  const [etiquetage, setEtiquetage] = useState<string | null>(null);
  const [prescriptionsPostActe, setPrescriptionsPostActe] = useState<string | null>(null);
  const [remarques, setRemarques] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!prescriptionId) return;
      try {
        const data = await apiJson<any>(`/api/checklists/apres/${prescriptionId}`);
        if (data) {
          setEtiquetage(data.confirmationEtiquetage || null);
          setPrescriptionsPostActe(data.prescriptionsPostActe || null);
          setRemarques(data.remarques || "");
        }
      } catch (err) {
        console.error("Erreur chargement checklist après :", err);
      }
    }
    loadData();
  }, [prescriptionId]);

  const saveChecklist = async (nextEtiquetage: string | null, nextPrescriptions: string | null, nextRemarques: string) => {
    if (!prescriptionId || !patientId) return;
    const payload = {
      prescriptionId,
      patientId,
      confirmationEtiquetage: nextEtiquetage,
      prescriptionsPostActe: nextPrescriptions,
      remarques: nextRemarques,
      estValide: !!nextEtiquetage && !!nextPrescriptions,
    };
    try {
      await apiFetch("/api/checklists/apres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Erreur sauvegarde checklist après :", err);
    }
  };

  const selectEtiquetage = (value: string) => {
    const next = etiquetage === value ? null : value;
    setEtiquetage(next);
    saveChecklist(next, prescriptionsPostActe, remarques);
  };

  const selectPrescriptions = (value: string) => {
    const next = prescriptionsPostActe === value ? null : value;
    setPrescriptionsPostActe(next);
    saveChecklist(etiquetage, next, remarques);
  };

  const handleRemarquesBlur = () => {
    saveChecklist(etiquetage, prescriptionsPostActe, remarques);
  };

  const handleValiderEtTerminer = async () => {
    await saveChecklist(etiquetage, prescriptionsPostActe, remarques);
    router.push("/resultat-endoscopie");
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
                <h3 className="font-headline text-xl text-blue-900">{patientName || "Patient inconnu"}</h3>
                <p className="text-slate-500 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">fingerprint</span>
                  ID: {patientId || "—"}
                </p>
              </div>
            </div>
            <div className="text-right px-4 py-2 bg-surface-container-low rounded-lg border-l-4 border-blue-700">
              <p className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">Type d&apos;examen</p>
              <p className="font-bold text-on-surface">{procedure || "Non spécifié"}</p>
            </div>
          </section>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <h2 className="font-headline text-blue-900 text-xl text-center px-4">2. APRÈS L&apos;ENDOSCOPIE</h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-secondary-container rounded-lg">
                  <span className="material-symbols-outlined text-on-secondary-fixed-variant">label</span>
                </div>
                <div>
                  <h4 className="font-headline text-on-surface">Confirmation &amp; Étiquetage</h4>
                  <p className="text-xs text-slate-500 mt-1">Confirmation orale du nom de l&apos;acte et étiquetage rigoureux des prélèvements.</p>
                </div>
              </div>
              <div className="flex gap-2">
                {ETIQUETAGE_OPTIONS.map(([label, value]) => {
                  const isSelected = etiquetage === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => selectEtiquetage(value)}
                      className={`flex-1 py-3 text-center rounded-lg border transition-all ${
                        isSelected
                          ? "bg-primary-container text-white border-primary-container shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-secondary-container rounded-lg">
                  <span className="material-symbols-outlined text-on-secondary-fixed-variant">history_edu</span>
                </div>
                <div>
                  <h4 className="font-headline text-on-surface">Prescriptions Post-Acte</h4>
                  <p className="text-xs text-slate-500 mt-1">Saisie et vérification des prescriptions médicales pour la phase de réveil.</p>
                </div>
              </div>
              <div className="flex gap-2">
                {PRESCRIPTIONS_OPTIONS.map(([label, value]) => {
                  const isSelected = prescriptionsPostActe === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => selectPrescriptions(value)}
                      className={`flex-1 py-3 text-center rounded-lg border transition-all ${
                        isSelected
                          ? "bg-primary-container text-white border-primary-container shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-surface-container-low rounded-lg">
                  <span className="material-symbols-outlined text-slate-600">rate_review</span>
                </div>
                <h4 className="font-headline text-on-surface">Remarques ou écarts constatés</h4>
              </div>
              <textarea
                value={remarques}
                onChange={(e) => setRemarques(e.target.value)}
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
          <a
            href="/prescription-workflow"
            className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 hover:bg-slate-50 mr-4"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Retour à l&apos;opération
          </a>
          <button
            onClick={handleValiderEtTerminer}
            className="px-8 py-3 bg-gradient-to-r from-[#00478D] to-[#005EB8] text-white rounded-xl shadow-lg shadow-blue-900/20 font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 hover:opacity-90"
          >
            Valider et Terminer
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default function ChecklistApresEndoscopiePage() {
  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        <ChecklistApresEndoscopieContent />
      </div>
    </AppShell>
  );
}
