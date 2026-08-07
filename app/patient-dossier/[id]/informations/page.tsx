"use client";

import { Suspense } from "react";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { useParams, useSearchParams } from "next/navigation";
import { PatientDossierInfoContent } from "@/components/patient-dossier/PatientDossierInfoContent";

function PatientDossierInfoPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const prescriptionId = params?.id ? decodeURIComponent(params.id as string) : "";
  // Venu du bouton "Voir le dossier patient" de la page de décision d'anesthésie ou de
  // l'opération endoscopie : le retour doit y ramener directement, pas passer par le
  // dossier patient résumé intermédiaire (sans intérêt dans ces deux parcours).
  const from = searchParams.get("from");
  const tab = searchParams.get("tab");
  const returnUrl =
    from === "decision"
      ? `/decisions-anesthesie/${encodeURIComponent(prescriptionId)}${tab ? `?tab=${encodeURIComponent(tab)}` : ""}`
      : from === "operation"
      ? "/prescription-workflow"
      : `/patient-dossier/${encodeURIComponent(prescriptionId)}`;
  const returnLabel =
    from === "decision"
      ? "Retour à la planification de l'examen"
      : from === "operation"
      ? "Retour à l'opération endoscopie"
      : "Retour au dossier patient";

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
          <PatientDossierInfoContent prescriptionId={prescriptionId} />
        ) : (
          <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 text-center text-on-surface-variant">
            Identifiant de prescription manquant.
          </section>
        )}
      </div>
    </AppShell>
  );
}

export default function PatientDossierInfoPage() {
  return (
    <Suspense fallback={null}>
      <PatientDossierInfoPageContent />
    </Suspense>
  );
}
