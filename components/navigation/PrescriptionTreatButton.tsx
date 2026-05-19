"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PrescriptionTreatButtonProps {
  patientId: string;
  patientName: string;
  procedure: string;
  prescriber?: string;
  reason?: string;
}

export default function PrescriptionTreatButton({
  patientId,
  patientName,
  procedure,
  prescriber,
  reason,
}: PrescriptionTreatButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleTreat = async () => {
    setIsLoading(true);

    // Store patient context in sessionStorage
    sessionStorage.setItem("currentPatientId", patientId);
    sessionStorage.setItem("currentPatientName", patientName);
    sessionStorage.setItem("currentProcedure", procedure);
    if (prescriber) sessionStorage.setItem("currentPrescriber", prescriber);
    if (reason) sessionStorage.setItem("currentReason", reason);
    sessionStorage.setItem("workflowStep", "Check-list Avant Endoscopie");

    // Navigate to checklist with patient info in URL
    await router.push(
      `/checklists/avant?patientId=${encodeURIComponent(patientId)}&patient=${encodeURIComponent(patientName)}&procedure=${encodeURIComponent(procedure)}`
    );

    setIsLoading(false);
  };

  return (
    <button
      onClick={handleTreat}
      disabled={isLoading}
      className="relative px-4 py-1.5 text-xs font-bold text-secondary hover:bg-secondary-container/20 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 border border-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden"
    >
      <div className="flex items-center justify-center gap-1">
        {isLoading ? (
          <>
            <span className="material-symbols-outlined text-xs animate-spin">
              hourglass_empty
            </span>
            Traitement...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-xs group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
            Traiter
          </>
        )}
      </div>

      {/* Smooth hover background effect */}
      <div className="absolute inset-0 bg-secondary-container/10 opacity-0 group-hover:opacity-100 transition-opacity -z-10 rounded-lg" />
    </button>
  );
}
