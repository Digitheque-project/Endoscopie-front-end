"use client";

import { useEffect, useState } from "react";

export default function WorkflowStepBadge() {
  const [step, setStep] = useState<string>("");

  useEffect(() => {
    const workflowStep = sessionStorage.getItem("workflowStep");
    setStep(workflowStep || "");
  }, []);

  if (!step) return null;

  const stepConfig: Record<string, { icon: string; color: string; bg: string }> = {
    "Check-list Avant Endoscopie": {
      icon: "fact_check",
      color: "text-blue-700",
      bg: "bg-blue-100",
    },
    "Prescription Workflow": {
      icon: "clinical_notes",
      color: "text-purple-700",
      bg: "bg-purple-100",
    },
    "Opération Endoscopie": {
      icon: "clinical_notes",
      color: "text-purple-700",
      bg: "bg-purple-100",
    },
    "Check-list Après Endoscopie": {
      icon: "task_alt",
      color: "text-green-700",
      bg: "bg-green-100",
    },
  };

  const config = stepConfig[step] || { icon: "info", color: "text-slate-700", bg: "bg-slate-100" };

  return (
    <div className={`${config.bg} ${config.color} px-4 py-2 rounded-full inline-flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-top-2 duration-500`}>
      <span className="material-symbols-outlined text-base">{config.icon}</span>
      <span>{step}</span>
    </div>
  );
}
