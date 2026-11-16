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
    <section className="bg-white rounded-2xl shadow-sm border border-[#F1F5F9] p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center">
          <span className="material-symbols-outlined">stethoscope</span>
        </div>
        <h2 className="text-lg font-bold text-[#0F172A]">Diagnostic Médical</h2>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Diagnostic principal</label>
          <input 
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8F9FB] focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-sm font-medium text-[#0F172A]"
            placeholder="Ex: Érythème gastrique mineur"
            value={mainDiagnosis}
            onChange={(e) => setMainDiagnosis(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Observations détaillées</label>
          <textarea 
            className="w-full min-h-[100px] px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8F9FB] focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-sm text-[#0F172A] resize-y"
            placeholder="Décrivez les observations anatomiques et pathologiques..."
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Conclusion médicale</label>
          <textarea 
            className="w-full min-h-[80px] px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8F9FB] focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-sm text-[#0F172A] font-medium resize-y"
            placeholder="Conclusion finale et interprétation du diagnostic..."
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
