"use client";

import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { useRouter } from "next/navigation";
import { use, Suspense } from "react";

function ChecklistApresContent({ searchParams }: { searchParams: Promise<any> }) {
  const resolvedParams = use(searchParams);
  const router = useRouter();
  const patientId = resolvedParams?.patientId ?? "458-992-331";

  const handleValiderEtTerminer = () => {
    router.push(`/resultat-endoscopie?patientId=${encodeURIComponent(patientId)}`);
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
                <h3 className="font-headline text-xl text-blue-900">MARCHAND, Pierre-Alain</h3>
                <p className="text-slate-500 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">fingerprint</span>
                  ID: {patientId} • Né le 12/05/1974 (49 ans)
                </p>
              </div>
            </div>
            <div className="text-right px-4 py-2 bg-surface-container-low rounded-lg border-l-4 border-blue-700">
              <p className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">Type d'examen</p>
              <p className="font-bold text-on-surface">Coloscopie Totale + Biopsies</p>
            </div>
          </section>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <h2 className="font-headline text-blue-900 text-xl text-center px-4">2. APRÈS L'ENDOSCOPIE</h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-secondary-container rounded-lg">
                  <span className="material-symbols-outlined text-on-secondary-fixed-variant">label</span>
                </div>
                <div>
                  <h4 className="font-headline text-on-surface">Confirmation & Étiquetage</h4>
                  <p className="text-xs text-slate-500 mt-1">Confirmation orale du nom de l'acte et étiquetage rigoureux des prélèvements.</p>
                </div>
              </div>
              <div className="flex gap-2">
                {[
                  ["Oui", "bg-primary-container text-white border-primary-container"],
                  ["Non", "bg-slate-50 text-slate-600 border-slate-200"],
                  ["N/A", "bg-slate-50 text-slate-600 border-slate-200"],
                ].map(([label, cls]) => (
                  <label key={label} className="flex-1 cursor-pointer group">
                    <input className="hidden peer" name="etiquetage" type="radio" />
                    <div className={`py-3 text-center rounded-lg border group-hover:bg-slate-100 transition-all ${cls}`}>{label}</div>
                  </label>
                ))}
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
                {[
                  ["Oui", "bg-primary-container text-white border-primary-container"],
                  ["Non", "bg-slate-50 text-slate-600 border-slate-200"],
                ].map(([label, cls]) => (
                  <label key={label} className="flex-1 cursor-pointer group">
                    <input className="hidden peer" name="prescriptions" type="radio" />
                    <div className={`py-3 text-center rounded-lg border group-hover:bg-slate-100 transition-all ${cls}`}>{label}</div>
                  </label>
                ))}
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
                className="w-full bg-surface-container-low border-0 border-b-2 border-slate-200 focus:border-blue-900 focus:ring-0 rounded-t-lg text-sm transition-all"
                placeholder="Décrivez d'éventuelles complications, anomalies ou notes cliniques importantes..."
                rows={4}
              />
            </div>
          </div>
        </div>
      </div>

      <footer className="fixed bottom-0 right-0 w-[calc(100%-16rem)] bg-white border-t border-slate-200 p-4 shadow-xl z-50">
        <div className="max-w-[896px] mx-auto flex items-center justify-between">
          <div className="flex-1 mr-12">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">Progression de la Checklist</span>
              <span className="text-xs font-bold text-blue-900">100%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00478D] to-[#005EB8] w-full rounded-full" />
            </div>
          </div>

          <a href="/prescription-workflow" className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 hover:bg-slate-50 mr-4">
            <span className="material-symbols-outlined">arrow_back</span>
            Retour à l'opération
          </a>
          <button onClick={handleValiderEtTerminer} className="px-8 py-3 bg-gradient-to-r from-[#00478D] to-[#005EB8] text-white rounded-xl shadow-lg shadow-blue-900/20 font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 hover:opacity-90">
            Valider et Terminer
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default function ChecklistApresPage(props: { searchParams: Promise<any> }) {
  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        <Suspense fallback={<div className="py-8 text-center text-slate-500 font-bold uppercase tracking-widest">Chargement de la check-list...</div>}>
          <ChecklistApresContent {...props} />
        </Suspense>
      </div>
    </AppShell>
  );
}
