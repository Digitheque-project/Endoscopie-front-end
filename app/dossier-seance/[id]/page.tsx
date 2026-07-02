"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { RequireRole } from "@/components/auth/RequireRole";
import { apiJson } from "@/lib/api";
import { usePatient } from "@/contexts/PatientContext";

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
  const { setPatientData } = usePatient();
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

  if (isLoading) {
    return (
      <AppShell>
        <div className={PAGE_CONTENT_CLASS}>
          <RequireRole role="MEDECIN">
            <div className="bg-white rounded-2xl p-8 animate-pulse space-y-4">
              <div className="h-6 w-48 bg-surface-container rounded" />
              <div className="h-4 w-72 bg-surface-container rounded" />
            </div>
          </RequireRole>
        </div>
      </AppShell>
    );
  }

  if (error || !prescription) {
    return (
      <AppShell>
        <div className={PAGE_CONTENT_CLASS}>
          <RequireRole role="MEDECIN">
            <div className="bg-white rounded-2xl p-8 text-center text-on-surface-variant">{error || "Dossier introuvable."}</div>
          </RequireRole>
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

  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        <RequireRole role="MEDECIN">
          {/* En-tête patient */}
          <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Dossier de séance</p>
              <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
                {patient ? `${patient.nom} ${patient.prenom}` : "Patient inconnu"}
              </h1>
              <p className="text-sm text-on-surface-variant mt-0.5">
                {[age != null ? `${age} ans` : null, patient?.sexe === "M" ? "Homme" : patient?.sexe === "F" ? "Femme" : null]
                  .filter(Boolean).join(" • ")}
              </p>
              <span className="inline-block mt-3 px-3 py-1 rounded-full bg-secondary-container text-secondary text-xs font-bold uppercase tracking-wider">
                {prescription.typeExamen}
              </span>
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
                <StatusBadge ok={!!(op?.medicalNotes)} label="Notes opération" />
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
                ].map(({ key, label }) => (
                  <div key={key} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${(ca as any)[key] ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400"}`}>
                    <span className="material-symbols-outlined text-[14px]">{(ca as any)[key] ? "check_circle" : "cancel"}</span>
                    {label}
                  </div>
                ))}
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
          {op ? (
            <Section title="Observations et notes d'opération" icon="clinical_notes">
              {op.medicalNotes ? (
                <Field label="Observations durant l'examen" value={op.medicalNotes} />
              ) : (
                <p className="text-sm text-on-surface-variant italic">Aucune observation enregistrée.</p>
              )}
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
              href="/comptes-rendus-en-attente"
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/20 px-5 py-3 text-sm font-semibold text-on-surface-variant hover:text-primary hover:border-primary transition-all"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Retour à la liste
            </a>
            {!prescription.resultatEndoscopie && (
              <button
                type="button"
                onClick={handleRediger}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-md"
              >
                <span className="material-symbols-outlined">edit_note</span>
                Rédiger le compte rendu
              </button>
            )}
            {prescription.resultatEndoscopie && (
              <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 text-emerald-700 px-5 py-3 text-sm font-bold">
                <span className="material-symbols-outlined">check_circle</span>
                Compte rendu déjà rédigé
              </span>
            )}
          </div>
        </RequireRole>
      </div>
    </AppShell>
  );
}

export default function DossierSeancePage() {
  return <DossierSeanceContent />;
}
