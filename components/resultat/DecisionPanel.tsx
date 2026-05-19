"use client";

import React from "react";

interface DecisionPanelProps {
  complication: string | null;
  setComplication: (val: string) => void;
  biopsy: string | null;
  setBiopsy: (val: string) => void;
  followUp: string;
  setFollowUp: (val: string) => void;
}

export default function DecisionPanel({
  complication, setComplication,
  biopsy, setBiopsy,
  followUp, setFollowUp
}: DecisionPanelProps) {
  
  const followUpOptions = [
    { id: "consultation", label: "Consultation classique", icon: "clinical_notes" },
    { id: "surveillance", label: "Surveillance renforcée", icon: "visibility" },
    { id: "intervention", label: "Intervention requise", icon: "emergency" },
  ];

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
          <span className="material-symbols-outlined">fact_check</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900">Décisions Médicales</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Boolean decisions */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Complication détectée lors de l'acte ?</label>
            <div className="flex gap-3">
              <button 
                onClick={() => setComplication("OUI")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${complication === "OUI" ? "bg-red-500 border-red-500 text-white shadow-md shadow-red-500/20" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                OUI
              </button>
              <button 
                onClick={() => setComplication("NON")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${complication === "NON" ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                NON
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Biopsie / Prélèvement réalisé ?</label>
            <div className="flex gap-3">
              <button 
                onClick={() => setBiopsy("OUI")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${biopsy === "OUI" ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                OUI
              </button>
              <button 
                onClick={() => setBiopsy("NON")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${biopsy === "NON" ? "bg-slate-500 border-slate-500 text-white shadow-md shadow-slate-500/20" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                NON
              </button>
            </div>
          </div>
        </div>

        {/* Follow-up selection */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3">Suivi recommandé post-endoscopie</label>
          <div className="flex flex-col gap-2">
            {followUpOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setFollowUp(opt.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
                  followUp === opt.id 
                  ? "bg-blue-50 border-blue-400 text-blue-900 shadow-sm" 
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${followUp === opt.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                  <span className="material-symbols-outlined text-[16px]">{opt.icon}</span>
                </div>
                <span className="font-semibold text-sm">{opt.label}</span>
                
                {followUp === opt.id && (
                  <span className="material-symbols-outlined ml-auto text-blue-600">check_circle</span>
                )}
              </button>
            ))}
          </div>
        </div>
        
      </div>
    </section>
  );
}
