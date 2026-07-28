"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { RequireRole } from "@/components/auth/RequireRole";
import { apiJson, verifierStatutCpa } from "@/lib/api";
import toast from "react-hot-toast";
import { PriseEnChargeBadge } from "@/components/patient/PriseEnChargeBadge";

function computeAge(dateNaissance?: string | null): number | null {
  if (!dateNaissance) return null;
  const birth = new Date(dateNaissance);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

const DECISION_STYLES: Record<string, { label: string; className: string; icon: string }> = {
  APTE: { label: "Apte", className: "bg-emerald-100 text-emerald-700", icon: "check_circle" },
  INAPTE: { label: "Inapte", className: "bg-error-container text-error", icon: "cancel" },
  REPORT: { label: "Reportée", className: "bg-amber-100 text-amber-700", icon: "schedule" },
};

function DossierCpaContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const dossierId = params.id;
  const [dossier, setDossier] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const data = await apiJson<any>(`/api/dossiers-cpa/${dossierId}`);
      setDossier(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger ce dossier CPA.");
    }
  };

  useEffect(() => {
    if (!dossierId) return;
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleVerifier = async () => {
    setIsVerifying(true);
    try {
      const result = await verifierStatutCpa(dossierId);
      if (result.blocSync === "en_attente") {
        toast("Le Bloc Opératoire n'a pas encore rendu de décision pour cette CPA.", { icon: "⏳" });
      } else if (result.blocSync === "erreur_bloc" || result.blocSync === "erreur_reseau") {
        toast.error("Impossible de contacter le Bloc Opératoire pour le moment. Réessayez plus tard.");
      } else if (result.blocSync === "synchronise") {
        toast.success("Statut CPA mis à jour.");
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la vérification du statut CPA.");
    } finally {
      setIsVerifying(false);
    }
  };

  const decision = dossier?.decisionCpa ? DECISION_STYLES[dossier.decisionCpa] : null;

  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        <RequireRole role="MAJOR">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">
              Résultat de la CPA
            </h1>
            <button
              type="button"
              onClick={() => router.push("/prescriptions")}
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/20 px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-primary hover:border-primary transition-all"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Retour au fil de prescription
            </button>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 animate-pulse space-y-4">
              <div className="h-6 w-48 bg-surface-container rounded" />
              <div className="h-4 w-72 bg-surface-container rounded" />
            </div>
          ) : error || !dossier ? (
            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 text-center text-on-surface-variant">
              {error || "Dossier CPA introuvable."}
            </div>
          ) : (
            <>
              <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">Patient</p>
                  <h2 className="font-headline text-lg font-extrabold tracking-tight">
                    {dossier.patient ? `${dossier.patient.nom} ${dossier.patient.prenom}` : "Patient inconnu"}
                  </h2>
                  <PriseEnChargeBadge priseEnChargeId={dossier.patient?.priseEnChargeId} className="mt-1" />
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {(() => {
                      const age = computeAge(dossier.patient?.dateNaissance);
                      return age != null ? `${age} ans` : null;
                    })()}
                  </p>
                  {dossier.prescription?.typeExamen && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-secondary-container text-secondary text-[10px] font-bold uppercase tracking-wider">
                      {dossier.prescription.typeExamen}
                    </span>
                  )}
                </div>
              </section>

              <section className="bg-white rounded-2xl shadow-md border-2 border-primary/20 p-6 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <p className="text-base font-bold uppercase tracking-widest text-on-surface">Décision du Bloc Opératoire</p>
                  {decision ? (
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-bold ${decision.className}`}>
                      <span className="material-symbols-outlined text-xl">{decision.icon}</span>
                      {decision.label}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 text-base font-semibold">
                      <span className="material-symbols-outlined text-xl">hourglass_empty</span>
                      En attente de décision
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold text-on-surface mb-1 border-b border-outline-variant/10 pb-1">Date de la CPA</h4>
                    <p className="text-sm text-on-surface-variant">
                      {dossier.dateCpa
                        ? new Date(dossier.dateCpa).toLocaleDateString("fr-FR", { dateStyle: "long" })
                        : "Non renseignée"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface mb-1 border-b border-outline-variant/10 pb-1">Anesthésiste</h4>
                    <p className="text-sm text-on-surface-variant">
                      {dossier.anesthesiste ? `Dr. ${dossier.anesthesiste.prenom} ${dossier.anesthesiste.nom}` : "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface mb-1 border-b border-outline-variant/10 pb-1">Visite pré-anesthésique (VPA)</h4>
                    <p className="text-sm text-on-surface-variant">
                      {dossier.dateVpa
                        ? `Réalisée le ${new Date(dossier.dateVpa).toLocaleDateString("fr-FR", { dateStyle: "long" })}`
                        : "Non encore réalisée"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface mb-1 border-b border-outline-variant/10 pb-1">Statut du dossier</h4>
                    <p className="text-sm text-on-surface-variant">{dossier.statut}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-on-surface mb-2 border-b border-outline-variant/10 pb-1">Observations</h4>
                  <p className="text-sm text-on-surface-variant whitespace-pre-wrap">
                    {dossier.observations || "Aucune observation."}
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={isVerifying}
                    onClick={handleVerifier}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg">refresh</span>
                    {isVerifying ? "Vérification…" : "Vérifier à nouveau auprès du Bloc"}
                  </button>
                </div>
              </section>
            </>
          )}
        </RequireRole>
      </div>
    </AppShell>
  );
}

export default function DossierCpaPage() {
  return (
    <Suspense fallback={null}>
      <DossierCpaContent />
    </Suspense>
  );
}
