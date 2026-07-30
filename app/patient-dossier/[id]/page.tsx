"use client";

import { Suspense } from "react";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { useParams, useSearchParams } from "next/navigation";
import { PatientDossierContent } from "@/components/patient-dossier/PatientDossierContent";

function PatientDossierPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const prescriptionId = params?.id ? decodeURIComponent(params.id as string) : "";
  const from = searchParams.get("from");
  // Onglet médecin ("À décider", "Prêt pour l'examen"...) actif quand le détail a été
  // ouvert depuis le Fil de prescription — restauré au retour pour ne pas retomber sur
  // "Tous" et perdre la liste filtrée sur laquelle l'utilisateur travaillait.
  const tab = searchParams.get("tab");
  const returnUrl =
    from === "dashboard" ? "/" : tab ? `/prescriptions?tab=${encodeURIComponent(tab)}` : "/prescriptions";
  const returnLabel = from === "dashboard" ? "Retour au tableau de bord" : "Retour à la liste des prescriptions";

  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        <a
          href={returnUrl}
          className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-white px-5 py-3 text-sm font-bold text-on-surface-variant shadow-sm transition-all hover:border-primary hover:text-primary hover:shadow-md"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span>{returnLabel}</span>
        </a>

        {prescriptionId ? (
          <PatientDossierContent prescriptionId={prescriptionId} />
        ) : (
          <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 text-center text-on-surface-variant">
            Identifiant de prescription manquant.
          </section>
        )}
      </div>
    </AppShell>
  );
}

export default function PatientDossierPage() {
  return (
    <Suspense fallback={null}>
      <PatientDossierPageContent />
    </Suspense>
  );
}
