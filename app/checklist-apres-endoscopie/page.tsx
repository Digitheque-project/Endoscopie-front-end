"use client";

import { AppShell } from "@/components/layout/AppShell";
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
    <div className="pt-8 pb-24 px-4 flex justify-center min-h-[1024px] bg-background text-on-surface">
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

        <div className="pt-8 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">Progression de la Checklist</span>
              <span className="text-sm font-bold text-blue-900">100%</span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-900 to-blue-500 w-full" />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            <a href="/prescription-workflow" className="w-full md:w-auto px-8 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group">
              <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
              Retour à l'opération
            </a>
            <button onClick={handleValiderEtTerminer} className="flex-1 w-full bg-gradient-to-r from-blue-900 to-blue-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-blue-900/20 hover:shadow-blue-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
              <span className="material-symbols-outlined">check_circle</span>
              Valider et Terminer le check-list
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChecklistApresPage(props: { searchParams: Promise<any> }) {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest">Chargement de la check-list...</div>}>
        <ChecklistApresContent {...props} />
      </Suspense>
    </AppShell>
  );
}
