"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { RequireRole } from "@/components/auth/RequireRole";
import { apiJson, updateRendezVous } from "@/lib/api";
import { PriseEnChargeBadge } from "@/components/patient/PriseEnChargeBadge";
import { fetchSessionSiblings, type SessionInfo } from "@/lib/exam-session";
import { getExamTypeBadgeClass } from "@/lib/exam-type-colors";

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
  const searchParams = useSearchParams();
  const prescriptionId = params.prescriptionId;
  // Onglet médecin d'où l'on vient (voir le bouton "Décider" du Fil de prescription) —
  // par défaut "à décider" puisque c'est la seule origine possible pour cette page.
  const medecinTab = searchParams.get("tab") || "a-decider";
  const [prescription, setPrescription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeciding, setIsDeciding] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [selectedAnesthesie, setSelectedAnesthesie] = useState<"Locale" | "Générale" | "Refuser" | null>(null);
  const [motifRefus, setMotifRefus] = useState("");
  const [showRefusConfirm, setShowRefusConfirm] = useState(false);
  const [chainingMessage, setChainingMessage] = useState<string | null>(null);
  const [propagationMessage, setPropagationMessage] = useState<string | null>(null);
  // Session groupée (plusieurs examens du même patient sur le même créneau) — la
  // décision d'anesthésie prise ici s'applique à toute la séance, pas qu'à cet examen.
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    if (!prescriptionId) {
      setSession(null);
      return;
    }
    let cancelled = false;
    fetchSessionSiblings(prescriptionId)
      .then((s) => { if (!cancelled) setSession(s); })
      .catch(() => { if (!cancelled) setSession(null); });
    return () => { cancelled = true; };
  }, [prescriptionId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      // Nouvel examen (enchaînement multi-examens, voir handleConfirmAnesthesie) : repart
      // d'un choix vierge plutôt que de garder la sélection de l'examen précédent.
      setSelectedAnesthesie(null);
      setMotifRefus("");
      setDecisionError(null);
      setChainingMessage(null);
      setPropagationMessage(null);
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
    if (selectedAnesthesie === "Refuser" && !motifRefus.trim()) return;
    setIsDeciding(true);
    setDecisionError(null);
    try {
      if (selectedAnesthesie === "Refuser") {
        const updated = await updateRendezVous(prescription.rendezVous.id, {
          statut: "Annulé",
          motifRefus: motifRefus.trim(),
        });
        // La prescription imbriquée dans la réponse est un instantané pris avant le
        // cascade serveur (statut/motifRefus répercutés sur Prescription juste après) —
        // on applique donc ici les mêmes valeurs qu'on vient d'envoyer, sans attendre un
        // rechargement complet, sinon le motif tout juste saisi n'apparaît pas.
        setPrescription((prev: any) => ({
          ...prev,
          statut: "Annulé",
          motifRefus: motifRefus.trim(),
          rendezVous: { ...prev.rendezVous, ...updated },
        }));
      } else {
        const updated = await updateRendezVous(prescription.rendezVous.id, {
          typeAnesthesie: selectedAnesthesie,
          statut: "Décision rendue",
        });
        setPrescription((prev: any) => ({
          ...prev,
          statut: "Décision rendue",
          rendezVous: { ...prev.rendezVous, ...updated },
        }));

        // Anesthésie locale : s'applique directement aux autres examens de la MÊME séance
        // (planifiés ensemble sur exactement le même créneau, voir session.sameSlot) —
        // jamais aux autres examens de la prescription multi-examens en général, qui
        // peuvent être de tout autre type et sur un jour différent, donc exiger chacun
        // leur propre décision.
        if (selectedAnesthesie === "Locale" && session?.sameSlot) {
          try {
            const siblingIds = session.exams
              .filter((ex) => ex.id !== prescription.id)
              .map((ex) => ex.id);
            const all = await apiJson<any[]>("/api/prescriptions");
            const siblings = (Array.isArray(all) ? all : []).filter(
              (p) => siblingIds.includes(p.id) && p.rendezVous && !p.rendezVous.typeAnesthesie,
            );
            await Promise.all(
              siblings.map((sib) =>
                updateRendezVous(sib.rendezVous.id, {
                  typeAnesthesie: "Locale",
                  statut: "Décision rendue",
                }).catch(() => undefined),
              ),
            );
            if (siblings.length > 0) {
              setPropagationMessage(
                `Anesthésie locale appliquée automatiquement à ${siblings.length} autre${siblings.length > 1 ? "s" : ""} examen${siblings.length > 1 ? "s" : ""} de cette même séance.`,
              );
            }
          } catch (e) {
            console.error("Erreur propagation anesthésie locale aux examens liés :", e);
          }
        }
      }
      // Prescription multi-examens sur des jours différents (pas la même séance, donc
      // pas couverte par la propagation "Locale" ci-dessus) : enchaîne sur le prochain
      // examen du même groupe encore sans décision, plutôt que de retourner directement
      // au fil de prescription en laissant les autres examens en attente indéfiniment.
      let nextSibling: any = null;
      if (prescription.prescriptionExternalId) {
        try {
          const all = await apiJson<any[]>("/api/prescriptions");
          nextSibling = (Array.isArray(all) ? all : []).find(
            (p) =>
              p.id !== prescription.id &&
              p.prescriptionExternalId === prescription.prescriptionExternalId &&
              p.rendezVous &&
              !p.rendezVous.typeAnesthesie &&
              p.rendezVous.statut !== "Annulé",
          ) ?? null;
        } catch (e) {
          console.error("Erreur recherche du prochain examen à décider :", e);
        }
      }

      setChainingMessage(
        nextSibling
          ? `Décision enregistrée. Passage à l'examen suivant : ${nextSibling.typeExamen || "examen suivant"}…`
          : "Décision enregistrée. Retour au fil de prescription…",
      );
      setTimeout(() => {
        if (nextSibling) {
          router.push(`/decisions-anesthesie/${encodeURIComponent(nextSibling.id)}?tab=${encodeURIComponent(medecinTab)}`);
        } else {
          // Plus aucun examen du groupe en attente — retour au fil de prescription sur
          // l'onglet d'origine pour enchaîner directement sur le patient suivant.
          router.push(`/prescriptions?tab=${encodeURIComponent(medecinTab)}`);
        }
      }, 1200);
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
          <button
            type="button"
            onClick={() => router.push(`/prescriptions?tab=${encodeURIComponent(medecinTab)}`)}
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/20 px-5 py-3 text-sm font-semibold text-on-surface-variant hover:text-primary hover:border-primary transition-all self-start"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Retour au fil de prescription
          </button>
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
                  <PriseEnChargeBadge priseEnChargeId={prescription.patient?.priseEnChargeId} className="mt-1" />
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {(() => {
                      const age = computeAge(prescription.patient?.dateNaissance);
                      return age != null ? `${age} ans` : null;
                    })()}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(session?.sameSlot ? session.exams.map((e) => e.typeExamen) : [prescription.typeExamen]).map((t, i) => (
                      <span
                        key={i}
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getExamTypeBadgeClass(t)}`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  {session?.sameSlot && (
                    <p className="mt-1.5 text-[10px] font-semibold text-amber-600">
                      Session groupée — la décision s&apos;appliquera aux {session.exams.length} examens de cette séance.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/patient-dossier/${encodeURIComponent(prescriptionId)}/informations?from=decision&tab=${encodeURIComponent(medecinTab)}`,
                    )
                  }
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
                    <h4 className="font-bold text-on-surface mb-1 border-b border-outline-variant/10 pb-1">Examen demandé</h4>
                    <p className="text-sm text-on-surface-variant">
                      {session?.sameSlot ? session.exams.map((e) => e.typeExamen).join(" + ") : prescription.typeExamen}
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
                    {prescription.rendezVous.statut === "Annulé" ? (
                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-error-container text-error text-lg font-bold">
                          <span className="material-symbols-outlined text-xl">cancel</span>
                          Examen refusé
                        </span>
                        {prescription.motifRefus && (
                          <p className="text-sm text-on-surface-variant">
                            <span className="font-bold">Motif :</span> {prescription.motifRefus}
                          </p>
                        )}
                      </div>
                    ) : prescription.rendezVous.typeAnesthesie ? (
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-lg font-bold">
                        <span className="material-symbols-outlined text-xl">check_circle</span>
                        Anesthésie {prescription.rendezVous.typeAnesthesie}
                      </span>
                    ) : (
                      <p className="text-base font-semibold text-amber-600">En attente de décision médicale.</p>
                    )}
                    {decisionError && <p className="text-sm text-error mt-2">{decisionError}</p>}
                    {chainingMessage && (
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-primary mt-2">
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                        {chainingMessage}
                      </p>
                    )}
                    {propagationMessage && (
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-primary mt-2">
                        <span className="material-symbols-outlined text-lg">layers</span>
                        {propagationMessage}
                      </p>
                    )}
                  </div>
                  {!prescription.rendezVous.typeAnesthesie && prescription.rendezVous.statut !== "Annulé" && (
                    <div className="flex flex-col gap-3 lg:items-end">
                      <div className="flex items-stretch gap-2">
                        <button
                          type="button"
                          disabled={isDeciding}
                          onClick={() => setSelectedAnesthesie("Locale")}
                          className={`flex-1 whitespace-nowrap px-4 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 ${
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
                          className={`flex-1 whitespace-nowrap px-4 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 ${
                            selectedAnesthesie === "Générale"
                              ? "bg-primary text-white shadow-md"
                              : "border-2 border-primary text-primary hover:bg-primary/5"
                          }`}
                        >
                          Anesthésie générale
                        </button>
                        {/* Séparateur visuel : Refuser a des conséquences différentes des deux
                            choix d'anesthésie ci-dessus, pas juste une 3ème option équivalente. */}
                        <div className="w-px bg-outline-variant/30 my-1" aria-hidden="true" />
                        <button
                          type="button"
                          disabled={isDeciding}
                          onClick={() => setSelectedAnesthesie("Refuser")}
                          className={`flex-1 whitespace-nowrap px-4 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 ${
                            selectedAnesthesie === "Refuser"
                              ? "bg-error text-white shadow-md"
                              : "border-2 border-error text-error hover:bg-error/5"
                          }`}
                        >
                          Refuser
                        </button>
                      </div>
                      {selectedAnesthesie === "Refuser" && (
                        <div className="w-full space-y-1.5">
                          <textarea
                            value={motifRefus}
                            onChange={(e) => setMotifRefus(e.target.value)}
                            placeholder="Motif du refus (obligatoire)"
                            rows={3}
                            disabled={isDeciding}
                            className="w-full rounded-xl border border-error/30 bg-error-container/10 px-3 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-error/20 focus:border-error/40 outline-none resize-none disabled:opacity-50"
                          />
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-error">
                            <span className="material-symbols-outlined text-sm">info</span>
                            Ce motif sera transmis au service qui a demandé l&apos;examen.
                          </p>
                        </div>
                      )}
                      <button
                        type="button"
                        disabled={!selectedAnesthesie || isDeciding || (selectedAnesthesie === "Refuser" && !motifRefus.trim())}
                        onClick={() => {
                          if (selectedAnesthesie === "Refuser") {
                            setShowRefusConfirm(true);
                          } else {
                            handleConfirmAnesthesie();
                          }
                        }}
                        className={`w-full lg:w-auto whitespace-nowrap px-8 py-4 rounded-xl text-white font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed ${
                          selectedAnesthesie === "Refuser" ? "bg-error" : "bg-emerald-600"
                        }`}
                      >
                        {isDeciding
                          ? "Confirmation…"
                          : selectedAnesthesie === "Refuser"
                            ? "Confirmer le refus"
                            : "Confirmer"}
                      </button>
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </RequireRole>
      </div>

      {showRefusConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/50 backdrop-blur-sm p-4" onClick={() => setShowRefusConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-outline-variant/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center text-error shrink-0">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <h2 className="text-lg font-headline font-bold">Confirmer le refus ?</h2>
            </div>
            <p className="text-sm text-on-surface-variant mb-6">
              Cet examen sera annulé et <span className="font-bold text-on-surface">le service qui l&apos;a demandé recevra une notification</span> avec le motif écrit. Cette action ne peut pas être annulée depuis cet écran.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRefusConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isDeciding}
                onClick={() => {
                  setShowRefusConfirm(false);
                  handleConfirmAnesthesie();
                }}
                className="px-4 py-2 rounded-lg bg-error text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Oui, refuser
              </button>
            </div>
          </div>
        </div>
      )}
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
