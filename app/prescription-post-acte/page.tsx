"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { RequireRole } from "@/components/auth/RequireRole";
import { apiFetch, apiJson } from "@/lib/api";
import { usePatient } from "@/contexts/PatientContext";
import { getExamTypeBadgeClass } from "@/lib/exam-type-colors";
import { fetchSessionSiblings, type SessionInfo } from "@/lib/exam-session";

/**
 * Étape dédiée à la prescription post-acte — extraite de la page Opération (où elle
 * était une carte + modale) pour tenir dans sa propre interface, entre l'opération et
 * la check-list après (voir le bouton "Passer Prescription Post-Acte" dans
 * prescription-workflow/page.tsx et son pendant "Passer Check-list Après" ici).
 */
function PrescriptionPostActeContent() {
  const router = useRouter();
  const { patientId, prescriptionId, patientName, procedure, setPatientData } = usePatient();
  const [session, setSession] = useState<SessionInfo | null>(null);

  const [prescriptionPostActe, setPrescriptionPostActe] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // Le reste de l'opération (dictée, notes) doit être préservé tel quel — saveOperation
  // (POST /api/operations) écrase tous les champs à chaque appel, jamais une fusion
  // partielle côté backend : on les recharge donc pour les renvoyer inchangés ici.
  const [existingOperation, setExistingOperation] = useState<{
    observationNotes: string | null;
    medicalNotes: string;
    voiceTranscripts: unknown[];
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!prescriptionId) return;
      setIsLoading(true);
      try {
        const opData = await apiJson<any>(`/api/operations/${prescriptionId}`).catch(() => null);
        if (opData) {
          setPrescriptionPostActe(opData.prescriptionPostActe || "");
          setExistingOperation({
            observationNotes: opData.observationNotes ?? null,
            medicalNotes: opData.medicalNotes || "",
            voiceTranscripts: opData.voiceTranscripts || [],
          });
        }
      } catch (err) {
        console.error("Erreur chargement operation:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [prescriptionId]);

  // Session groupée (plusieurs examens du même patient sur le même créneau, voir
  // getSameSlotSiblings côté backend) — affichée dans le titre comme dans l'opération,
  // pour ne pas perdre de vue qu'il y a d'autres examens à couvrir.
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

  // Bascule vers un autre examen de la même session — enregistre d'abord la prescription
  // post-acte en cours pour ne rien perdre, puis change de contexte patient (déclenche le
  // rechargement des données d'opération pour ce nouvel examen, voir loadData ci-dessus).
  const handleSwitchExam = async (exam: SessionInfo["exams"][number]) => {
    if (!prescriptionId || exam.id === prescriptionId) return;
    await save();
    setPatientData({ prescriptionId: exam.id, procedure: exam.typeExamen });
  };

  const save = async () => {
    if (!prescriptionId || !patientId) return;
    setIsSaving(true);
    try {
      await apiFetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prescriptionId,
          patientId,
          observationNotes: existingOperation?.observationNotes ?? null,
          medicalNotes: existingOperation?.medicalNotes ?? "",
          voiceTranscripts: existingOperation?.voiceTranscripts ?? [],
          prescriptionPostActe: prescriptionPostActe || null,
        }),
      });
    } catch (err) {
      console.error("Erreur sauvegarde prescription post-acte:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <RequireRole role="MEDECIN">
      <div className={PAGE_CONTENT_CLASS}>
        <div className="space-y-5 pb-24">
          <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-sky-700 px-6 py-8 text-white lg:px-8 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
                <span className="material-symbols-outlined text-[18px]">history_edu</span>
                Prescription Post-Acte
              </div>
              <p className="font-headline text-2xl font-extrabold tracking-tight">{patientName}</p>
              {/* Seule la procédure est centrée — pas le nom du patient ni le bandeau
                  au-dessus. Même style que le titre de procédure dans l'opération (grand,
                  majuscules, couleur par type d'examen) — cohérence entre les deux interfaces. */}
              {session?.sameSlot && session.exams.length > 1 ? (
                // Examens multiples sur la même séance — même case à cocher que dans
                // l'opération, pour voir/choisir directement l'examen en cours ici aussi.
                <div className="flex flex-wrap justify-center gap-2">
                  {session.exams.map((exam) => (
                    <label
                      key={exam.id}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${getExamTypeBadgeClass(exam.typeExamen)} ${
                        exam.id === prescriptionId ? "ring-2 ring-white shadow-md" : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={exam.id === prescriptionId}
                        onChange={() => handleSwitchExam(exam)}
                        className="h-3.5 w-3.5 rounded"
                      />
                      {exam.typeExamen}
                    </label>
                  ))}
                </div>
              ) : (
                procedure && (
                  <div className="flex justify-center">
                    <p className={`inline-flex items-center rounded-2xl px-4 py-2 text-2xl lg:text-3xl font-black uppercase tracking-wide ${getExamTypeBadgeClass(procedure)}`}>
                      {procedure}
                    </p>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] lg:p-6 space-y-4">
            <div>
              <h3 className="font-headline text-base text-slate-900">Phase de réveil</h3>
              <p className="text-xs text-slate-500 mt-0.5">Saisie et vérification des prescriptions médicales pour la phase de réveil.</p>
            </div>
            {isLoading ? (
              <p className="text-sm text-slate-400">Chargement…</p>
            ) : (
              <textarea
                autoFocus
                value={prescriptionPostActe}
                onChange={(event) => setPrescriptionPostActe(event.target.value)}
                rows={10}
                placeholder="Ex : Paracétamol 1g si douleur, surveillance constantes 2h, reprise alimentation à 4h..."
                className="min-h-64 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            )}
          </section>
        </div>
      </div>

      <footer className="fixed bottom-0 right-0 w-full lg:w-[calc(100%-16rem)] bg-white border-t border-slate-200 p-4 shadow-xl z-50">
        <div className="max-w-[896px] mx-auto flex items-center justify-end">
          <button
            onClick={async () => {
              await save();
              router.push("/prescription-workflow");
            }}
            className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 hover:bg-slate-50 mr-4"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Retour à l&apos;opération
          </button>
          <button
            onClick={async () => {
              await save();
              router.push("/checklists/apres");
            }}
            disabled={isSaving}
            className="px-8 py-3 bg-gradient-to-r from-[#00478D] to-[#005EB8] text-white rounded-xl shadow-lg shadow-blue-900/20 font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 hover:opacity-90 disabled:opacity-60"
          >
            {isSaving ? "Enregistrement…" : "Passer Check-list Après"}
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      </footer>
    </RequireRole>
  );
}

export default function PrescriptionPostActePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Chargement...</div>}>
        <PrescriptionPostActeContent />
      </Suspense>
    </AppShell>
  );
}
