"use client";

import { useState, useRef, use, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { appendFinalSegment } from "@/components/voice/formatTranscript";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { RequireRole } from "@/components/auth/RequireRole";
import VoiceRecorder from "@/components/voice/VoiceRecorder";
import TranscriptionEditor, { type SavedTranscriptionEntry } from "@/components/voice/TranscriptionEditor";
import { truncateText } from "@/components/voice/formatTranscript";
import HistoryModal from "@/components/ui/HistoryModal";
import { apiFetch, apiJson, apiUrl } from "@/lib/api";
import { usePatient } from "@/contexts/PatientContext";

function PrescriptionWorkflowContent() {
  const router = useRouter();
  const { patientId, prescriptionId, patientName, procedure } = usePatient();
  const [medicalNotes, setMedicalNotes] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [savedMedicalNotes, setSavedMedicalNotes] = useState<SavedTranscriptionEntry[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const lastSavedTranscriptionRef = useRef("");
  const controlsRef = useRef<{ start: () => void; stop: () => void; restart: () => void; pause: () => void; resume: () => void } | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!prescriptionId) return;
      try {
        const data = await apiJson<any>(`/api/operations/${prescriptionId}`);
        if (data) {
          setMedicalNotes(data.medicalNotes || "");
          setSavedMedicalNotes(data.voiceTranscripts || []);
        }
      } catch (err) {
        console.error("Erreur chargement operation:", err);
      }
    }
    loadData();
  }, [prescriptionId]);

  const saveOperation = async () => {
    if (!prescriptionId || !patientId) return;
    const payload = {
      prescriptionId,
      patientId,
      medicalNotes,
      voiceTranscripts: savedMedicalNotes
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

  const handleFinalTranscript = (text: string, meta?: { startsAfterPause?: boolean }) => {
    const normalized = text.trim();
    if (!normalized) return;

    setTranscriptText((cur) => appendFinalSegment(cur, normalized, Boolean(meta?.startsAfterPause)));
  };

  const handleAudioReady = (_blob: Blob) => {
    // audio blob ready for upload if needed
  };

  const handleSaveEditor = () => {
    const normalizedTranscript = transcriptText.trim();
    if (!normalizedTranscript) return;
    setMedicalNotes((cur) => (cur && cur.trim().length > 0 ? `${cur}\n\n${normalizedTranscript}` : normalizedTranscript));
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
    setTranscriptText("");
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
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
                    <span className="material-symbols-outlined text-[18px]">clinical_notes</span>
                    Opération Endoscopie
                  </div>
                  <div className="space-y-2">
                    <p className="max-w-2xl text-sm leading-6 text-blue-50/90 lg:text-base">
                      Étape intermédiaire du parcours clinique avec transcription vocale, prescriptions et suivi médical.
                    </p>
                  </div>
                </div>


              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] lg:p-6">
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
                <button onClick={handleSaveEditor} type="button" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">Ajouter aux notes complémentaires</button>
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
          </section>
        </div>
      </div>

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
              router.push('/checklists/apres');
            }}
            className="px-8 py-3 bg-gradient-to-r from-[#00478D] to-[#005EB8] text-white rounded-xl shadow-lg shadow-blue-900/20 font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 hover:opacity-90"
          >
            Passer Check-list Après
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
