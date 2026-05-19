"use client";

import React, { useState } from "react";

interface SignatureBlockProps {
  doctorName: string;
  setDoctorName: (val: string) => void;
  onValidate: () => void;
  isSubmitting?: boolean;
  isSuccess?: boolean;
}

export default function SignatureBlock({ doctorName, setDoctorName, onValidate, isSubmitting = false, isSuccess = false }: SignatureBlockProps) {
  const [isSigned, setIsSigned] = useState(false);

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
          <span className="material-symbols-outlined">draw</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900">Validation et Signature</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
        
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nom du Médecin / Opérateur</label>
            <input 
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-400 transition-all text-sm font-bold text-slate-800"
              placeholder="Dr. Jean Dupont"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex justify-between items-center">
              <span>Signature Électronique</span>
              {isSigned && <span className="text-emerald-500 flex items-center gap-1 text-[10px]"><span className="material-symbols-outlined text-[14px]">verified</span> Signé</span>}
            </label>
            <div 
              onClick={() => setIsSigned(true)}
              className={`w-full h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isSigned ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
              }`}
            >
              {isSigned ? (
                <div className="font-signature text-3xl text-emerald-800 opacity-80" style={{ fontFamily: "cursive" }}>
                  {doctorName || "Signé"}
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-slate-400 mb-1">gesture</span>
                  <span className="text-xs font-medium text-slate-500">Cliquez ou dessinez pour signer</span>
                </>
              )}
            </div>
            {isSigned && (
              <button onClick={() => setIsSigned(false)} className="text-[10px] text-slate-500 hover:text-slate-800 font-bold uppercase mt-1">Effacer la signature</button>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 md:pt-0">
          <button 
            onClick={onValidate}
            disabled={isSubmitting || isSuccess}
            className={`flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-blue-300/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none ${
              isSuccess 
                ? "!bg-emerald-500 text-white" 
                : isSubmitting 
                  ? "bg-blue-600/80 text-white cursor-wait" 
                  : "bg-blue-600 text-white"
            }`}
          >
            {isSuccess ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-pulse">check_circle</span>
                Résultat validé avec succès
              </>
            ) : isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                Validation en cours...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">task_alt</span>
                Valider le résultat
              </>
            )}
          </button>
        </div>

      </div>
    </section>
  );
}
