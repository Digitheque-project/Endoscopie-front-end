"use client";

import React from "react";

interface MedicalReportProps {
  reportText: string;
  setReportText: (text: string) => void;
}

export default function MedicalReport({ reportText, setReportText }: MedicalReportProps) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
          <span className="material-symbols-outlined">description</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900">Compte rendu de l'endoscopie</h2>
      </div>
      
      <div className="relative">
        <textarea
          className="w-full min-h-[200px] p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all resize-y"
          placeholder="Rédigez le compte rendu médical ici, ou utilisez la dictée vocale..."
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
        />
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 hover:scale-105 transition-all duration-200 shadow-sm" title="Dictée vocale">
            <span className="material-symbols-outlined text-[18px]">mic</span>
          </button>
        </div>
      </div>
    </section>
  );
}
