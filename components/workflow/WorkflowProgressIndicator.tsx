"use client";

import { usePathname } from "next/navigation";

export default function WorkflowProgressIndicator() {
  const pathname = usePathname();

  const steps = [
    { name: "Check-list Avant", path: "/checklists/avant", icon: "fact_check", number: 1 },
    { name: "Prescription", path: "/prescription-workflow", icon: "clinical_notes", number: 2 },
    { name: "Check-list Après", path: "/checklists/apres", icon: "task_alt", number: 3 },
  ];

  const currentStepIndex = steps.findIndex((step) => pathname.includes(step.path));

  if (currentStepIndex === -1) return null;

  return (
    <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
      {steps.map((step, index) => (
        <div key={step.path} className="flex items-center">
          {/* Step Circle */}
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all ${
              index === currentStepIndex
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-110"
                : index < currentStepIndex
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-600"
            }`}
          >
            {index < currentStepIndex ? (
              <span className="material-symbols-outlined text-base">check</span>
            ) : (
              <span className="material-symbols-outlined text-base">{step.icon}</span>
            )}
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={`h-1 w-8 mx-2 rounded-full transition-colors ${
                index < currentStepIndex ? "bg-green-500" : "bg-gray-300"
              }`}
            />
          )}
        </div>
      ))}

      {/* Current Step Label */}
      <div className="ml-4 flex flex-col gap-1">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Étape {currentStepIndex + 1}/3</span>
        <span className="text-sm font-bold text-slate-900">{steps[currentStepIndex].name}</span>
      </div>
    </div>
  );
}
