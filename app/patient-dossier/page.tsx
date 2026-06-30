"use client";

import { Suspense } from "react";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { useSearchParams } from "next/navigation";
import { usePatient } from "@/contexts/PatientContext";
import { PatientDossierContent } from "@/components/patient-dossier/PatientDossierContent";

function PatientDossierPageContent() {
  const searchParams = useSearchParams();
  const patientContext = usePatient();
  const prescriptionId = searchParams.get("prescriptionId") || patientContext.prescriptionId || "";

  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        <a
          href="/patients"
          className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-white px-5 py-3 text-sm font-bold text-on-surface-variant shadow-sm transition-all hover:border-primary hover:text-primary hover:shadow-md"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span>Retour à la liste des patients</span>
        </a>

        {prescriptionId ? (
          <PatientDossierContent prescriptionId={prescriptionId} />
        ) : (
          <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 text-center text-on-surface-variant">
            Aucun dossier sélectionné — recherchez un patient depuis Archives ou le Fil de prescription.
          </section>
        )}
      </div>
    </AppShell>
  );
}

export default function PatientDossierPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500">Chargement...</div>}>
      <PatientDossierPageContent />
    </Suspense>
  );
}
