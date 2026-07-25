"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { RequireRole } from "@/components/auth/RequireRole";
import { apiJson, updateRendezVous } from "@/lib/api";

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

function PlanificationExamenContent() {
  const router = useRouter();
  const params = useParams<{ prescriptionId: string }>();
  const prescriptionId = params.prescriptionId;
  const [prescription, setPrescription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeciding, setIsDeciding] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [selectedAnesthesie, setSelectedAnesthesie] = useState<"Locale" | "Générale" | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiJson<any>(`/api/prescriptions/${prescriptionId}`);
        if (!cancelled) setPrescription(data);
      } catch (err) {
        if (!cancelled) setError("Impossible de charger ce dossier.");
        console.error("Erreur chargement planification examen :", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [prescriptionId]);

  const handleConfirmAnesthesie = async () => {
    if (!prescription?.rendezVous || !selectedAnesthesie) return;
    setIsDeciding(true);
    setDecisionError(null);
    try {
      const updated = await updateRendezVous(prescription.rendezVous.id, {
        typeAnesthesie: selectedAnesthesie,
        statut: "Décision rendue",
      });
      setPrescription((prev: any) => ({ ...prev, rendezVous: { ...prev.rendezVous, ...updated } }));
      // Décision rendue pour ce patient — retour au fil de prescription sur "À décider"
      // pour enchaîner directement sur le patient suivant en attente.
      setTimeout(() => {
        router.push("/prescriptions?tab=a-decider");
      }, 1000);
    } catch (err) {
      setDecisionError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement de la décision.");
    } finally {
      setIsDeciding(false);
    }
  };

  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        <RequireRole role="MEDECIN">
          <h1 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">
            Planification de l&apos;examen
          </h1>

          {isLoading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 animate-pulse space-y-4">
              <div className="h-6 w-48 bg-surface-container rounded" />
              <div className="h-4 w-72 bg-surface-container rounded" />
            </div>
          ) : error || !prescription ? (
            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 text-center text-on-surface-variant">
              {error || "Dossier introuvable."}
            </div>
          ) : (
            <>
              <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">Patient</p>
                  <h2 className="font-headline text-lg font-extrabold tracking-tight">
                    {prescription.patient ? `${prescription.patient.nom} ${prescription.patient.prenom}` : "Patient inconnu"}
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {(() => {
                      const age = computeAge(prescription.patient?.dateNaissance);
                      return age != null ? `${age} ans` : null;
                    })()}
                  </p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-secondary-container text-secondary text-[10px] font-bold uppercase tracking-wider">
                    {prescription.typeExamen}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/patient-dossier/${encodeURIComponent(prescriptionId)}/informations`)}
                  title="Voir le dossier patient complet"
                  aria-label="Voir le dossier patient complet"
                  className="flex items-center justify-center w-11 h-11 rounded-xl border border-outline-variant/20 text-primary hover:bg-primary/10 transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-2xl">contact_page</span>
                </button>
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-5 space-y-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Détails de la prescription</p>
                  <div>
                    <h4 className="font-bold text-on-surface mb-2 border-b border-outline-variant/10 pb-1">Motif de la demande</h4>
                    <p className="text-sm text-on-surface-variant">{prescription.motif || "Aucun motif renseigné."}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface mb-2 border-b border-outline-variant/10 pb-1">Antécédents médicaux</h4>
                    <p className="text-sm text-on-surface-variant">{prescription.patient?.antecedentsMedicaux || "Aucun antécédent renseigné."}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface mb-1 border-b border-outline-variant/10 pb-1">Poids</h4>
                    <p className="text-sm text-on-surface-variant">
                      {prescription.patient?.poids != null ? `${prescription.patient.poids} kg` : "Non renseigné"}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-5 space-y-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Rendez-vous planifié par le major</p>
                  {prescription.rendezVous ? (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-bold text-on-surface mb-1 border-b border-outline-variant/10 pb-1">Date et heure</h4>
                        <p className="text-sm text-on-surface-variant">
                          {new Date(prescription.rendezVous.dateHeureDebut).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface mb-1 border-b border-outline-variant/10 pb-1">Salle</h4>
                        <p className="text-sm text-on-surface-variant">
                          {prescription.rendezVous.salle
                            ? `${prescription.rendezVous.salle.nom}${prescription.rendezVous.salle.numero ? ` (${prescription.rendezVous.salle.numero})` : ""}`
                            : "Non renseignée"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-on-surface-variant">Aucun rendez-vous planifié pour l&apos;instant.</p>
                  )}
                </div>
              </section>

              {prescription.rendezVous && (
                <section className="bg-white rounded-2xl shadow-md border-2 border-primary/20 p-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-base font-bold uppercase tracking-widest text-on-surface mb-3">Décision d&apos;anesthésie</p>
                    {prescription.rendezVous.typeAnesthesie ? (
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-lg font-bold">
                        <span className="material-symbols-outlined text-xl">check_circle</span>
                        Anesthésie {prescription.rendezVous.typeAnesthesie}
                      </span>
                    ) : (
                      <p className="text-base font-semibold text-amber-600">En attente de décision médicale.</p>
                    )}
                    {decisionError && <p className="text-sm text-error mt-2">{decisionError}</p>}
                  </div>
                  {!prescription.rendezVous.typeAnesthesie && (
                    <div className="flex flex-col gap-4 lg:items-end">
                      <div className="flex flex-wrap gap-4">
                        <button
                          type="button"
                          disabled={isDeciding}
                          onClick={() => setSelectedAnesthesie("Locale")}
                          className={`whitespace-nowrap px-8 py-4 rounded-xl font-bold text-base transition-colors disabled:opacity-50 ${
                            selectedAnesthesie === "Locale"
                              ? "bg-primary text-white shadow-md"
                              : "border-2 border-primary text-primary hover:bg-primary/5"
                          }`}
                        >
                          Anesthésie locale
                        </button>
                        <button
                          type="button"
                          disabled={isDeciding}
                          onClick={() => setSelectedAnesthesie("Générale")}
                          className={`whitespace-nowrap px-8 py-4 rounded-xl font-bold text-base transition-colors disabled:opacity-50 ${
                            selectedAnesthesie === "Générale"
                              ? "bg-primary text-white shadow-md"
                              : "border-2 border-primary text-primary hover:bg-primary/5"
                          }`}
                        >
                          Anesthésie générale
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={!selectedAnesthesie || isDeciding}
                        onClick={handleConfirmAnesthesie}
                        className="w-full lg:w-auto whitespace-nowrap px-8 py-4 rounded-xl bg-emerald-600 text-white font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isDeciding ? "Confirmation…" : "Confirmer"}
                      </button>
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </RequireRole>
      </div>
    </AppShell>
  );
}

export default function PlanificationExamenPage() {
  return (
    <Suspense fallback={null}>
      <PlanificationExamenContent />
    </Suspense>
  );
}
