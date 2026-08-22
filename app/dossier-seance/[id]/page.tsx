"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { apiJson } from "@/lib/api";
import { usePatient } from "@/contexts/PatientContext";
import { mapProcedureToExamType, getConstatationsFields } from "@/lib/examOrgans";
import { PriseEnChargeBadge } from "@/components/patient/PriseEnChargeBadge";
import { getExamTypeBadgeClass } from "@/lib/exam-type-colors";

function computeAge(dateNaissance?: string | null): number | null {
  if (!dateNaissance) return null;
  const birth = new Date(dateNaissance);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
      <span className="material-symbols-outlined text-[12px]">{ok ? "check_circle" : "radio_button_unchecked"}</span>
      {label}
    </span>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-outline-variant/15 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-outline-variant/10 pb-3">
        <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
        <h3 className="font-bold text-on-surface text-base">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">{label}</p>
      <p className="text-sm text-on-surface whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function DossierSeanceContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { role } = useAuth();
  const { setPatientData } = usePatient();
  // D'où l'utilisateur est arrivé — pour que "Retour" le ramène là plutôt que sur une
  // page par défaut qui ne correspond pas forcément à son parcours (archives, liste des
  // comptes rendus en attente...).
  const from = searchParams.get("from");
  const backHref = from === "archives" ? "/archives" : "/comptes-rendus-en-attente";
  const backLabel = from === "archives" ? "Retour aux archives" : "Retour à la liste";
  const [prescription, setPrescription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiJson<any>(`/api/prescriptions/${params.id}`);
        if (!cancelled) setPrescription(data);
      } catch {
        if (!cancelled) setError("Impossible de charger le dossier.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [params.id]);

  const handleRediger = () => {
    if (!prescription) return;
    const patient = prescription.patient;
    const patientName = patient ? `${patient.nom} ${patient.prenom}`.trim() : "";
    const prescriberName = prescription.medecinPrescripteur
      ? `Dr. ${prescription.medecinPrescripteur.prenom} ${prescription.medecinPrescripteur.nom}`.trim()
      : "";
    setPatientData({
      patientId: prescription.patientId,
      prescriptionId: prescription.id,
      patientName,
      procedure: prescription.typeExamen || "",
      prescriber: prescriberName,
      priority: prescription.priorite || "NORMAL",
    });
    router.push("/resultat-endoscopie");
  };

  // Compte rendu déjà rédigé mais checklist après pas encore validée : seul chemin
  // restant pour que l'examen passe "Terminé" et sorte de cette page d'attente.
  const handleCompleterChecklist = () => {
    if (!prescription) return;
    const patient = prescription.patient;
    const patientName = patient ? `${patient.nom} ${patient.prenom}`.trim() : "";
    setPatientData({
      patientId: prescription.patientId,
      prescriptionId: prescription.id,
      patientName,
      procedure: prescription.typeExamen || "",
    });
    router.push("/checklists/apres");
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className={PAGE_CONTENT_CLASS}>
          <div className="bg-white rounded-2xl p-8 animate-pulse space-y-4">
            <div className="h-6 w-48 bg-surface-container rounded" />
            <div className="h-4 w-72 bg-surface-container rounded" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !prescription) {
    return (
      <AppShell>
        <div className={PAGE_CONTENT_CLASS}>
          <div className="bg-white rounded-2xl p-8 text-center text-on-surface-variant">{error || "Dossier introuvable."}</div>
        </div>
      </AppShell>
    );
  }

  const patient = prescription.patient;
  const age = computeAge(patient?.dateNaissance);
  const ca = prescription.checklistAvant;
  const cap = prescription.checklistApres;
  const op = prescription.operationEndoscopie;
  const rdv = prescription.rendezVous;

  const voiceTranscripts: Array<{ content: string; timestamp?: string }> =
    Array.isArray(op?.voiceTranscripts) ? op.voiceTranscripts : [];

  // Tout ce que le médecin a rédigé dans le compte rendu (observations par organe,
  // conclusion, recommandations, note complémentaire) — affiché ici aussi pour que ce
  // dossier de séance reste le résumé complet, pas seulement la dictée brute pendant l'opération.
  const resultat = prescription.resultatEndoscopie;
  let resultatDetails: any = null;
  try {
    resultatDetails = resultat?.details ? JSON.parse(resultat.details) : null;
  } catch {
    resultatDetails = null;
  }
  const examType = mapProcedureToExamType(prescription.typeExamen);
  const constatations: Record<string, string> | undefined = resultatDetails?.constatations;
  const constatationsFilled = examType && constatations
    ? getConstatationsFields(examType)
        .map((f) => ({ label: f.label, value: constatations[f.key]?.trim() }))
        .filter((f) => f.value)
    : [];
  const recommandations: string | undefined = resultatDetails?.recommandations;
  const resultatHasContent = Boolean(
    resultat && (constatationsFilled.length > 0 || resultat.conclusion || recommandations || resultat.observations),
  );

  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
          {/* En-tête patient */}
          <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Dossier de séance</p>
              <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
                {patient ? `${patient.nom} ${patient.prenom}` : "Patient inconnu"}
              </h1>
              <PriseEnChargeBadge priseEnChargeId={patient?.priseEnChargeId} className="mt-1" />
              <p className="text-sm text-on-surface-variant mt-0.5">
                {[age != null ? `${age} ans` : null, patient?.sexe === "M" ? "Homme" : patient?.sexe === "F" ? "Femme" : null]
                  .filter(Boolean).join(" • ")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getExamTypeBadgeClass(prescription.typeExamen)}`}>
                  {prescription.typeExamen}
                </span>
                {rdv?.typeExamenSecondaire && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getExamTypeBadgeClass(rdv.typeExamenSecondaire)}`}>
                    + {rdv.typeExamenSecondaire}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              {rdv && (
                <p className="text-sm text-on-surface-variant">
                  <span className="font-semibold">Examen :</span>{" "}
                  {new Date(rdv.dateHeureDebut).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}
                  {rdv.salle ? ` • ${rdv.salle.nom}` : ""}
                </p>
              )}
              <div className="flex gap-2 mt-1">
                <StatusBadge ok={!!ca?.estValide} label="Checklist avant" />
                <StatusBadge ok={!!cap?.estValide} label="Checklist après" />
                <StatusBadge ok={!!(op?.observationNotes)} label="Notes opération" />
              </div>
            </div>
          </div>

          {/* Checklist avant */}
          {ca ? (
            <Section title="Checklist avant l'endoscopie" icon="fact_check">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: "identiteVerifiee", label: "Identité vérifiée" },
                  { key: "jeuneRespecte", label: "Jeûne respecté" },
                  { key: "antibioprophylaxie", label: "Antibioprophylaxie" },
                  { key: "anticoagulantsArretes", label: "Anticoagulants arrêtés" },
                  { key: "tenueAppropriee", label: "Tenue appropriée" },
                  { key: "procedureConfirmee", label: "Procédure confirmée" },
                  { key: "materielDisponible", label: "Matériel disponible" },
                  { key: "risquesVerifies", label: "Risques vérifiés" },
                  { key: "preparationAdequate", label: "Préparation adéquate" },
                ].map(({ key, label }) => {
                  // "Antibioprophylaxie" / "Anticoagulants arrêtés" sont stockés en texte
                  // ("OUI"/"NON"/"NA", voir schema.prisma) — les autres restent des
                  // booléens classiques. "NA" (non applicable à ce patient) ne doit
                  // apparaître ni coché ni en échec, sinon une réponse volontaire d'ordre
                  // clinique légitime se lit comme un oubli.
                  const value = (ca as any)[key];
                  const isNA = value === "NA";
                  const isChecked = value === true || value === "OUI";
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                        isChecked ? "bg-emerald-50 text-emerald-700" : isNA ? "bg-slate-50 text-slate-500" : "bg-slate-50 text-slate-400"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {isChecked ? "check_circle" : isNA ? "remove_circle" : "cancel"}
                      </span>
                      {label}
                      {isNA && <span className="text-[10px] font-normal">(N/A)</span>}
                    </div>
                  );
                })}
              </div>
              {ca.observations && <Field label="Observations" value={ca.observations} />}
              <div className="pt-2 border-t border-outline-variant/10">
                <StatusBadge ok={ca.estValide} label={ca.estValide ? "Checklist validée" : "Non validée"} />
              </div>
            </Section>
          ) : (
            <div className="rounded-2xl border border-outline-variant/15 bg-slate-50 p-5 text-sm text-on-surface-variant">
              Checklist avant non renseignée.
            </div>
          )}

          {/* Notes d'opération */}
          {(op || resultatHasContent) ? (
            <Section title="Observations et notes d'opération" icon="clinical_notes">
              {op && (
                <>
                  {op.observationNotes ? (
                    <Field label="Observation durant l'examen (dictée vocale)" value={op.observationNotes} />
                  ) : (
                    <p className="text-sm text-on-surface-variant italic">Aucune observation vocale enregistrée.</p>
                  )}
                  {op.medicalNotes && <Field label="Notes complémentaires" value={op.medicalNotes} />}
                  {voiceTranscripts.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Notes complémentaires vocales</p>
                      <div className="space-y-2">
                        {voiceTranscripts.map((t: any, i: number) => (
                          <div key={t.id || i} className="rounded-xl bg-surface-container-low px-4 py-3">
                            {t.timestamp && (
                              <p className="text-[10px] text-on-surface-variant mb-1">{t.timestamp}</p>
                            )}
                            <p className="text-sm text-on-surface whitespace-pre-wrap">{t.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {resultatHasContent && (
                <div className={`space-y-4 ${op ? "pt-3 border-t border-outline-variant/10" : ""}`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Rédigé dans le compte rendu</p>
                  {constatationsFilled.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Observations par organe</p>
                      <div className="space-y-1.5">
                        {constatationsFilled.map((f) => (
                          <p key={f.label} className="text-sm text-on-surface">
                            <span className="font-semibold">{f.label} :</span> {f.value}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {resultat.conclusion && <Field label="Conclusion" value={resultat.conclusion} />}
                  {recommandations && <Field label="Recommandations" value={recommandations} />}
                  {resultat.observations && <Field label="Note(s) complémentaire(s)" value={resultat.observations} />}
                </div>
              )}
            </Section>
          ) : (
            <div className="rounded-2xl border border-outline-variant/15 bg-slate-50 p-5 text-sm text-on-surface-variant">
              Aucune note d'opération enregistrée.
            </div>
          )}

          {/* Checklist après */}
          {cap ? (
            <Section title="Checklist après l'endoscopie" icon="task_alt">
              <Field label="Confirmation d'étiquetage" value={cap.confirmationEtiquetage} />
              <Field label="Prescriptions post-acte" value={cap.prescriptionsPostActe} />
              <Field label="Remarques" value={cap.remarques} />
              <div className="pt-2 border-t border-outline-variant/10">
                <StatusBadge ok={cap.estValide} label={cap.estValide ? "Checklist validée" : "Non validée"} />
              </div>
            </Section>
          ) : (
            <div className="rounded-2xl border border-outline-variant/15 bg-slate-50 p-5 text-sm text-on-surface-variant">
              Checklist après non renseignée.
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <a
              href={backHref}
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/20 px-5 py-3 text-sm font-semibold text-on-surface-variant hover:text-primary hover:border-primary transition-all"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              {backLabel}
            </a>
            {role === "MEDECIN" && !prescription.resultatEndoscopie && (
              <button
                type="button"
                onClick={handleRediger}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-md"
              >
                <span className="material-symbols-outlined">edit_note</span>
                Rédiger le compte rendu
              </button>
            )}
            {prescription.resultatEndoscopie && !cap?.estValide && (
              <button
                type="button"
                onClick={handleCompleterChecklist}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-md"
              >
                <span className="material-symbols-outlined">checklist</span>
                Compléter la checklist après
              </button>
            )}
            {prescription.resultatEndoscopie && cap?.estValide && (
              <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 text-emerald-700 px-5 py-3 text-sm font-bold">
                <span className="material-symbols-outlined">check_circle</span>
                Compte rendu déjà rédigé
              </span>
            )}
          </div>
      </div>
    </AppShell>
  );
}

export default function DossierSeancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Chargement...</div>}>
      <DossierSeanceContent />
    </Suspense>
  );
}
