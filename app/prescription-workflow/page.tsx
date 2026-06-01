"use client";

import { useState, useRef, use, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { appendFinalSegment, handleManualPause as formatManualPause } from "@/components/voice/formatTranscript";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import VoiceRecorder from "@/components/voice/VoiceRecorder";
import TranscriptionEditor, { type SavedTranscriptionEntry } from "@/components/voice/TranscriptionEditor";
import { truncateText } from "@/components/voice/formatTranscript";
import HistoryModal from "@/components/ui/HistoryModal";
import { apiFetch, apiUrl } from "@/lib/api";
import { usePatient } from "@/contexts/PatientContext";

function PrescriptionWorkflowContent() {
  const router = useRouter();
  const { patientId, prescriptionId, patientName, procedure } = usePatient();
  const [medicalNotes, setMedicalNotes] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [savedMedicalNotes, setSavedMedicalNotes] = useState<SavedTranscriptionEntry[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const lastSavedTranscriptionRef = useRef("");
  const controlsRef = useRef<{ start: () => void; stop: () => void; restart: () => void; pause: () => void; resume: () => void } | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!prescriptionId) return;
      try {
        const resp = await fetch(apiUrl(`/api/operations/${prescriptionId}`));
        if (resp.ok) {
          const text = await resp.text();
          if (text) {
            const data = JSON.parse(text);
            if (data) {
              setMedicalNotes(data.medicalNotes || "");
              setSavedMedicalNotes(data.voiceTranscripts || []);
            }
          }
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

  const handleTranscriptChange = (data: { final?: string; interim?: string }) => {
    const finalPart = data?.final ?? "";
    const interim = data?.interim ?? "";
    // show formatted final text + interim
    const display = (finalPart ? (finalPart + (interim ? " " + interim : "")) : interim).trim();
    setLiveTranscript(display || "");
  };

  const handleFinalTranscript = (text: string, meta?: { startsAfterPause?: boolean }) => {
    const normalized = text.trim();
    if (!normalized) return;

    setTranscriptText((cur) => {
      const out = appendFinalSegment(cur, normalized, Boolean(meta?.startsAfterPause));
      return out;
    });

    // update live transcript to reflect formatted final with no interim
    setLiveTranscript((prev) => {
      // construct from latest transcriptText (state updated async) conservatively
      return ""; // will be set via onTranscriptChange which provides formatted final
    });
  };

  const handleManualPause = () => {
    setTranscriptText((cur) => formatManualPause(cur));
    setLiveTranscript((cur) => formatManualPause(cur));
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
    setLiveTranscript("");
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
      <div className={PAGE_CONTENT_CLASS}>
        <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-sky-700 px-6 py-8 text-white lg:px-8">
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

          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)] lg:p-7">
              <VoiceRecorder onTranscriptChange={handleTranscriptChange} onFinalTranscript={handleFinalTranscript} onManualPause={handleManualPause} onAudio={handleAudioReady} exposeControls={setControls} />
              <div className="mt-2">
                <div className="text-xs text-slate-500">Aperçu (transcription en temps réel)</div>
                <div className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-sm text-slate-700 leading-5 space-y-1">{liveTranscript || "(aucune dictée en cours)"}</div>
              </div>
              <div className="mt-4 text-xs text-slate-500">Utilise l&apos;API vocale du navigateur. Fonctionne surtout sur les navigateurs Chromium compatibles.</div>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)] lg:p-7 lg:pl-6 lg:border-l lg:border-slate-100">
              <TranscriptionEditor
                text={transcriptText}
                onChange={setTranscriptText}
                onSave={handleSaveEditor}
                onSaveTranscription={handleSaveTranscription}
                onCancel={handleCancelEdit}
                onClear={handleClearEditor}
              />

              <div className="mt-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900">Notes enregistrées</div>
                  <button onClick={() => setShowHistoryModal(true)} className="rounded-2xl bg-white border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50">Voir tout</button>
                </div>
                {!latestSavedNote ? (
                  <div className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-sm leading-tight">Aucune note enregistrée</div>
                ) : (
                  <div className="mt-2 rounded-lg bg-slate-50 p-2 text-sm">
                    <div className="rounded-md border border-slate-200 bg-white p-2">
                      <p className="text-xs text-slate-500">{latestSavedNote.timestamp}</p>
                      <p className="mt-1 text-sm text-slate-700 leading-5">{truncateText(latestSavedNote.content, 50)}</p>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900">Historique</div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-slate-500">{savedMedicalNotes.length} éléments</div>
                      <button onClick={() => setShowHistoryModal(true)} className="rounded-2xl bg-white border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50">Voir tout</button>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    {latestHistories.map((entry) => (
                      <div key={entry.id} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                        <p className="text-xs text-slate-500">{entry.timestamp}</p>
                        <p className="mt-1 text-sm text-slate-700 leading-5">{truncateText(entry.content, 50)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <HistoryModal open={showHistoryModal} onClose={() => setShowHistoryModal(false)} entries={savedMedicalNotes} onDelete={handleDeleteSavedTranscription} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)] lg:p-7">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <span className="material-symbols-outlined">notes</span>
              </span>
              <div>
                <h2 className="font-manrope text-lg font-bold text-slate-900">Notes médicales</h2>
                <p className="text-sm text-slate-500">Informations cliniques importantes à transmettre à l&apos;équipe d&apos;endoscopie.</p>
              </div>
            </div>

            <textarea
              className="min-h-56 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Saisir ici les notes médicales, le contexte clinique, les traitements à surveiller ou toute observation pertinente..."
              rows={8}
              onChange={(event) => setMedicalNotes(event.target.value)}
              value={medicalNotes}
            />
          </section>
        </div>
      </div>

      <footer className="fixed bottom-0 right-0 w-full lg:w-[calc(100%-16rem)] bg-white border-t border-slate-200 p-4 shadow-xl z-50">
        <div className="max-w-[896px] mx-auto flex items-center justify-between">
          <div className="flex-1 mr-12 hidden md:block">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">Progression de la checklist</span>
              <span className="text-xs font-bold text-blue-900">66% (PHASE 2/3)</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00478D] to-[#005EB8] w-2/3 rounded-full" />
            </div>
          </div>

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
