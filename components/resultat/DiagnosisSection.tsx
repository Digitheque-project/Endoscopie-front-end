"use client";

import React from "react";

interface DiagnosisSectionProps {
  mainDiagnosis: string;
  setMainDiagnosis: (val: string) => void;
  observations: string;
  setObservations: (val: string) => void;
  conclusion: string;
  setConclusion: (val: string) => void;
}

export default function DiagnosisSection({
  mainDiagnosis, setMainDiagnosis,
  observations, setObservations,
  conclusion, setConclusion
}: DiagnosisSectionProps) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center">
          <span className="material-symbols-outlined">stethoscope</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900">Diagnostic Médical</h2>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Diagnostic principal</label>
          <input 
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-sm font-medium text-slate-800"
            placeholder="Ex: Érythème gastrique mineur"
            value={mainDiagnosis}
            onChange={(e) => setMainDiagnosis(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Observations détaillées</label>
          <textarea 
            className="w-full min-h-[100px] px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-sm text-slate-800 resize-y"
            placeholder="Décrivez les observations anatomiques et pathologiques..."
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Conclusion médicale</label>
          <textarea 
            className="w-full min-h-[80px] px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-sm text-slate-800 font-medium resize-y"
            placeholder="Conclusion finale et interprétation du diagnostic..."
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
