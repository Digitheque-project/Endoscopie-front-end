"use client";

import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { useParams } from "next/navigation";
import { PatientDossierContent } from "@/components/patient-dossier/PatientDossierContent";

export default function PatientDossierPage() {
  const params = useParams();
  const prescriptionId = params?.id ? decodeURIComponent(params.id as string) : "";

  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        <a
          href="/prescriptions"
          className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-white px-5 py-3 text-sm font-bold text-on-surface-variant shadow-sm transition-all hover:border-primary hover:text-primary hover:shadow-md"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span>Retour à la liste des prescriptions</span>
        </a>

        {prescriptionId ? (
          <PatientDossierContent prescriptionId={prescriptionId} />
        ) : (
          <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-8 text-center text-on-surface-variant">
            Identifiant de prescription manquant.
          </section>
        )}
      </div>
    </AppShell>
  );
}
