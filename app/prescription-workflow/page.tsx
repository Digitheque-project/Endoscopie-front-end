"use client";

import { useState, useRef, use, useEffect, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { appendFinalSegment, capitalizeFirst, ensureEndsWithPunctuation } from "@/components/voice/formatTranscript";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { RequireRole } from "@/components/auth/RequireRole";
import VoiceRecorder from "@/components/voice/VoiceRecorder";
import TranscriptionEditor, { type SavedTranscriptionEntry } from "@/components/voice/TranscriptionEditor";
import { truncateText } from "@/components/voice/formatTranscript";
import HistoryModal from "@/components/ui/HistoryModal";
import { apiFetch, apiJson, apiUrl } from "@/lib/api";
import { usePatient } from "@/contexts/PatientContext";
import { mapProcedureToExamType, getConstatationsFields } from "@/lib/examOrgans";
import { fetchSessionSiblings, nextExamWithoutOperation, type SessionInfo } from "@/lib/exam-session";


function PrescriptionWorkflowContent() {
  const router = useRouter();
  const { patientId, prescriptionId, patientName, procedure, setPatientData } = usePatient();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [medicalNotes, setMedicalNotes] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [savedMedicalNotes, setSavedMedicalNotes] = useState<SavedTranscriptionEntry[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [prescriptionPostActe, setPrescriptionPostActe] = useState("");
  const [showPostActeModal, setShowPostActeModal] = useState(false);
  const [draftPostActe, setDraftPostActe] = useState("");
  const [organIndex, setOrganIndex] = useState(0);
const lastSavedTranscriptionRef = useRef("");
  const controlsRef = useRef<{ start: () => void; stop: () => void; restart: () => void; pause: () => void; resume: () => void } | null>(null);

  // Liste des organes à décrire pour ce type d'examen — dictée guidée organe par
  // organe (voir handleFinalTranscript) : même source que le compte rendu, pour que
  // les deux restent alignés.
  const examType = useMemo(() => mapProcedureToExamType(procedure), [procedure]);
  const organFields = useMemo(() => (examType ? getConstatationsFields(examType) : []), [examType]);
  const currentOrgan = organFields[organIndex];
  // VoiceRecorder ne reconstruit son écouteur SpeechRecognition qu'au démarrage de
  // l'écoute (pas à chaque re-render) : onFinalTranscript reste donc figé sur les
  // valeurs de son closure d'origine pendant toute une session d'écoute continue.
  // On passe par des refs, synchronisées pendant le rendu (pas via un effet, qui
  // laisserait une fenêtre où la ref serait encore vide/obsolète), pour toujours lire
  // l'organe courant à l'instant de l'appel plutôt que celui capturé au démarrage.
  const organIndexRef = useRef(organIndex);
  organIndexRef.current = organIndex;
  const organFieldsRef = useRef(organFields);
  organFieldsRef.current = organFields;

  // Écrit automatiquement le nom de l'organe directement dans le champ "Observation
  // durant l'examen" dès que c'est son tour — le médecin n'a plus qu'à dicter
  // l'observation pour compléter la ligne (voir handleFinalTranscript).
  useEffect(() => {
    if (!currentOrgan) return;
    const label = `${currentOrgan.label} : `;
    setTranscriptText((cur) => {
      if (cur.endsWith(label)) return cur;
      if (!cur.trim()) return label;
      const withPunctuation = ensureEndsWithPunctuation(cur.replace(/\s+$/, ''));
      return `${withPunctuation}\n${label}`;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrgan]);

  useEffect(() => {
    async function loadData() {
      if (!prescriptionId) return;
      // Pas de reset ici : l'effet d'écriture automatique de l'organe (ci-dessus)
      // dépend de currentOrgan et s'exécute dans le même rendu quand on change
      // d'examen (voir handleNextExam) — remettre transcriptText à "" ici, après lui,
      // écraserait le libellé du premier organe qu'il vient d'écrire.
      try {
        const opData = await apiJson<any>(`/api/operations/${prescriptionId}`).catch(() => null);
        if (opData) {
          if (opData.observationNotes) setTranscriptText(opData.observationNotes);
          setMedicalNotes(opData.medicalNotes || "");
          setSavedMedicalNotes(opData.voiceTranscripts || []);
          setPrescriptionPostActe(opData.prescriptionPostActe || "");
        }
      } catch (err) {
        console.error("Erreur chargement operation:", err);
      }
    }
    loadData();
  }, [prescriptionId]);

  // Session groupée (plusieurs examens du même patient sur le même créneau, voir
  // getSameSlotSiblings côté backend) — permet d'enchaîner la dictée procédure par
  // procédure sans quitter la page opération tant qu'il en reste.
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

  const saveOperation = async (postActeOverride?: string) => {
    if (!prescriptionId || !patientId) return;
    const payload = {
      prescriptionId,
      patientId,
      observationNotes: transcriptText || null,
      medicalNotes,
      voiceTranscripts: savedMedicalNotes,
      prescriptionPostActe: (postActeOverride ?? prescriptionPostActe) || null,
    };
    try {
      await apiFetch('/api/operations', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
    }
  };

  // Auto-save : enregistre les notes si l'utilisateur quitte la page sans cliquer
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!prescriptionId || !patientId) return;
      const payload = JSON.stringify({ prescriptionId, patientId, observationNotes: transcriptText || null, medicalNotes, voiceTranscripts: savedMedicalNotes, prescriptionPostActe: prescriptionPostActe || null });
      navigator.sendBeacon('/api/operations', new Blob([payload], { type: 'application/json' }));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [prescriptionId, patientId, medicalNotes, savedMedicalNotes, prescriptionPostActe]);

  const handleFinalTranscript = (text: string, meta?: { startsAfterPause?: boolean }) => {
    const normalized = text.trim();
    if (!normalized) return;

    const fields = organFieldsRef.current;
    const organ = fields[organIndexRef.current];

    if (organ) {
      // Dictée guidée : le nom de l'organe est déjà écrit dans le champ (voir l'effet
      // ci-dessus) — on complète la ligne avec l'observation dictée. Ne PAS avancer
      // vers l'organe suivant ici : le micro finalise un segment dès la moindre pause
      // naturelle (même en pleine phrase), donc avancer automatiquement à chaque
      // segment coupait la description en plein milieu — voir advanceToNextOrgan,
      // déclenché uniquement par le bouton "Organe suivant".
      const answer = capitalizeFirst(normalized);
      setTranscriptText((cur) => (cur.endsWith(' ') || !cur ? cur + answer : `${cur} ${answer}`));
      return;
    }

    setTranscriptText((cur) => appendFinalSegment(cur, normalized, Boolean(meta?.startsAfterPause)));
  };

  // Déclenché par le bouton "Organe suivant" — seul point d'avancement de la dictée
  // guidée désormais (voir handleFinalTranscript).
  const advanceToNextOrgan = () => {
    const fields = organFieldsRef.current;
    const nextIndex = Math.min(organIndexRef.current + 1, fields.length);
    organIndexRef.current = nextIndex;
    setOrganIndex(nextIndex);
  };

  const handleAudioReady = (_blob: Blob) => {
    // audio blob ready for upload if needed
  };

  const handleSaveTranscription = (text: string) => {
    const normalized = text.trim();
    if (!normalized) return;

    if (lastSavedTranscriptionRef.current === normalized) {
      return;
    }

    const newEntry: SavedTranscriptionEntry = {
      id: Date.now().toString(),
      content: normalized,
      timestamp: new Date().toLocaleString("fr-FR"),
    };

    setSavedMedicalNotes((prev) => [newEntry, ...prev]);
    lastSavedTranscriptionRef.current = normalized;
  };

  const handleDeleteSavedTranscription = (id: string) => {
    setSavedMedicalNotes((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleClearEditor = () => {
    organIndexRef.current = 0;
    setOrganIndex(0);
    const firstOrgan = organFieldsRef.current[0];
    setTranscriptText(firstOrgan ? `${firstOrgan.label} : ` : "");
  };

  
  const handleNotesFinalTranscript = (text: string, meta?: { startsAfterPause?: boolean }) => {
    const normalized = text.trim();
    if (!normalized) return;

    setMedicalNotes((cur) => {
      const out = appendFinalSegment(cur, normalized, Boolean(meta?.startsAfterPause));
      return out;
    });
  };

  const handleCancelEdit = () => {
    setTranscriptText("");
  };

  const setControls = (c: { start: () => void; stop: () => void; restart: () => void; pause: () => void; resume: () => void } | null) => {
    controlsRef.current = c;
  };

  const latestSavedNote = savedMedicalNotes[0];
  const latestHistories = savedMedicalNotes.slice(0, 2);

  return (
    <AppShell>
      <RequireRole role="MEDECIN">
      <div className={PAGE_CONTENT_CLASS}>
        <div className="space-y-5">
          <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-sky-700 px-6 py-6 text-white lg:px-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
                      <span className="material-symbols-outlined text-[18px]">clinical_notes</span>
                      Opération Endoscopie
                    </div>
                    {session?.sameSlot && (
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                        <span className="material-symbols-outlined text-[16px]">layers</span>
                        Examen {session.exams.findIndex((e) => e.id === prescriptionId) + 1} / {session.exams.length}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="max-w-2xl text-sm leading-6 text-blue-50/90 lg:text-base">
                      Étape intermédiaire du parcours clinique avec transcription vocale, prescriptions et suivi médical.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/patient-dossier/${encodeURIComponent(prescriptionId)}/informations?from=operation`)}
                  title="Voir le dossier patient"
                  aria-label="Voir le dossier patient"
                  className="flex items-center justify-center w-11 h-11 rounded-xl border border-white/30 bg-white/15 text-white hover:bg-white/25 transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-2xl">contact_page</span>
                </button>
              </div>
            </div>
          </section>



          <section className="space-y-5">
            <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] lg:p-6">
              {organFields.length > 0 ? (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {organFields.map((field, i) => (
                      <span
                        key={field.key}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                          i === organIndex
                            ? "bg-blue-600 text-white"
                            : i < organIndex
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {i < organIndex && <span className="material-symbols-outlined text-[14px]">check</span>}
                        {field.label}
                      </span>
                    ))}
                  </div>
                  {currentOrgan && (
                    <button
                      type="button"
                      onClick={advanceToNextOrgan}
                      title="Passer à l'organe suivant — dictez librement, avec toutes les pauses nécessaires, puis cliquez ici quand vous avez fini de décrire cet organe"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shrink-0"
                    >
                      Organe suivant
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  )}
                </div>
              ) : procedure ? (
                <p className="mb-4 text-xs text-amber-600">
                  Type d&apos;examen « {procedure} » non reconnu — dictée guidée par organe indisponible pour cette procédure.
                </p>
              ) : null}

              <div className="mb-6">
                <VoiceRecorder hideTextArea statusIdleText="Observation durant l'examen" onFinalTranscript={handleFinalTranscript} onAudio={handleAudioReady} exposeControls={setControls} />
              </div>

              <textarea
                className="min-h-56 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder=""
                rows={8}
                onChange={(event) => setTranscriptText(event.target.value)}
                value={transcriptText}
              />

              <div className="mt-4 flex flex-wrap gap-2 items-center justify-end border-t border-slate-100 pt-4">
                <button onClick={handleClearEditor} type="button" className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 transition-colors">Effacer la transcription</button>
                <button onClick={() => handleSaveTranscription(transcriptText)} type="button" className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors">Enregistrer la transcription</button>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] lg:p-6">
            <div className="mb-6">
              <VoiceRecorder hideTextArea statusIdleText="Notes complémentaires" onFinalTranscript={handleNotesFinalTranscript} />
            </div>

            <textarea
              className="min-h-56 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder=""
              rows={8}
              onChange={(event) => setMedicalNotes(event.target.value)}
              value={medicalNotes}
            />

            <div className="mt-4 flex flex-wrap gap-2 items-center justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setMedicalNotes("")}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
              >
                Effacer la note
              </button>
              <button
                type="button"
                onClick={() => handleSaveTranscription(medicalNotes)}
                className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                Enregistrer la note
              </button>
            </div>
          </section>

          <section
            onClick={() => {
              setDraftPostActe(prescriptionPostActe);
              setShowPostActeModal(true);
            }}
            className="cursor-pointer rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] lg:p-6 flex items-center justify-between gap-4 transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <span className="material-symbols-outlined text-2xl">history_edu</span>
              </div>
              <div>
                <h3 className="font-headline text-base text-slate-900">Prescriptions Post-Acte</h3>
                <p className="text-xs text-slate-500 mt-0.5">Saisie et vérification des prescriptions médicales pour la phase de réveil.</p>
              </div>
            </div>
            {prescriptionPostActe.trim() ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shrink-0">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Rédigée
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 shrink-0">
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                À rédiger
              </span>
            )}
          </section>
        </div>
      </div>

      {showPostActeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowPostActeModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <span className="material-symbols-outlined text-2xl">history_edu</span>
              </div>
              <div>
                <h3 className="font-headline text-lg font-bold text-slate-900">Prescriptions Post-Acte</h3>
                <p className="text-xs text-slate-500">Phase de réveil — rédigez la prescription du patient.</p>
              </div>
            </div>
            <textarea
              autoFocus
              value={draftPostActe}
              onChange={(event) => setDraftPostActe(event.target.value)}
              rows={8}
              placeholder="Ex : Paracétamol 1g si douleur, surveillance constantes 2h, reprise alimentation à 4h..."
              className="min-h-48 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPostActeModal(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  setPrescriptionPostActe(draftPostActe);
                  setShowPostActeModal(false);
                  await saveOperation(draftPostActe);
                }}
                className="rounded-xl bg-gradient-to-r from-[#00478D] to-[#005EB8] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 right-0 w-full lg:w-[calc(100%-16rem)] bg-white border-t border-slate-200 p-4 shadow-xl z-50">
        <div className="max-w-[896px] mx-auto flex items-center justify-end">

          <button
            onClick={async () => {
              await saveOperation();
              router.push('/checklists/avant');
            }}
            className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 hover:bg-slate-50 mr-4"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Retour Check-list Avant
          </button>
          <button
            onClick={async () => {
              await saveOperation();
              // Session groupée : s'il reste un examen sans dictée enregistrée, on
              // enchaîne dessus au lieu de quitter la page opération.
              const freshSession = prescriptionId ? await fetchSessionSiblings(prescriptionId).catch(() => null) : null;
              const next = freshSession && prescriptionId ? nextExamWithoutOperation(freshSession, prescriptionId) : null;
              if (next) {
                // Reset synchrone AVANT de changer d'examen : l'effet d'écriture automatique
                // de l'organe (dépend de currentOrgan) doit repartir d'un champ vide, pas
                // continuer à ajouter à la suite du texte de l'examen précédent.
                setTranscriptText("");
                setMedicalNotes("");
                setSavedMedicalNotes([]);
                setPrescriptionPostActe("");
                organIndexRef.current = 0;
                setOrganIndex(0);
                setPatientData({ prescriptionId: next.id, procedure: next.typeExamen });
                return;
              }
              router.push('/checklists/apres');
            }}
            className="px-8 py-3 bg-gradient-to-r from-[#00478D] to-[#005EB8] text-white rounded-xl shadow-lg shadow-blue-900/20 font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 hover:opacity-90"
          >
            {session?.sameSlot && nextExamWithoutOperation(session, prescriptionId || "")
              ? "Examen suivant"
              : "Passer Check-list Après"}
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      </footer>
      </RequireRole>
    </AppShell>
  );
}

export default function PrescriptionWorkflowPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <PrescriptionWorkflowContent />
    </Suspense>
  );
}
