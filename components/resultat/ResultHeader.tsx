"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface ResultHeaderProps {
  patientName: string;
  patientId: string;
  patientAge: number;
}

export default function ResultHeader({ patientName, patientId, patientAge }: ResultHeaderProps) {
  const router = useRouter();
  
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-900 mb-2">Résultat d'Endoscopie</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[18px] text-blue-600">person</span>
              {patientName}
            </div>
            <span className="text-slate-300">|</span>
            <div>{patientAge} ans</div>
          </div>
        </div>
      </div>
    </section>
  );
}
