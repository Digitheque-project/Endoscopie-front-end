"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  patient: string;
  id: string;
  rendezVousId?: string;
  prescriptionId?: string;
  patientId?: string;
  procedure?: string;
};

export default function TreatButton({ patient, id, rendezVousId, prescriptionId, patientId, procedure }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleTreat = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // preserve patient info and workflow step across navigation
      if (typeof window !== "undefined") {
        sessionStorage.setItem("currentPatientId", patientId || id);
        sessionStorage.setItem("currentPatientName", patient);
        sessionStorage.setItem("workflowStep", "Check-list Avant Endoscopie");
      }
      // navigate client-side with query params
      const params = new URLSearchParams();
      params.set("patientId", patientId || id);
      params.set("patient", patient);
      if (rendezVousId) params.set("rendezVousId", rendezVousId);
      if (prescriptionId) params.set("prescriptionId", prescriptionId);
      if (procedure) params.set("procedure", procedure);
      
      await router.push(`/checklists/avant?${params.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleTreat}
      aria-label={`Traiter ${patient}`}
      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 flex items-center gap-2 ${loading ? "bg-primary/30 text-white" : "bg-primary/5 text-primary hover:bg-primary/10"}`}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin">autorenew</span>
      ) : (
        <span className="material-symbols-outlined">play_arrow</span>
      )}
      Traiter
    </button>
  );
}
