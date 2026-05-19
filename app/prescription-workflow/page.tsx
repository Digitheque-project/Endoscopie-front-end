"use client";

import { useState, useRef } from "react";
import { appendFinalSegment, handleManualPause as formatManualPause } from "@/components/voice/formatTranscript";
import { AppShell } from "@/components/layout/AppShell";
import VoiceRecorder from "@/components/voice/VoiceRecorder";
import TranscriptionEditor, { type SavedTranscriptionEntry } from "@/components/voice/TranscriptionEditor";
import { truncateText } from "@/components/voice/formatTranscript";
import HistoryModal from "@/components/ui/HistoryModal";

export default function PrescriptionWorkflowPage() {
  const [medicalNotes, setMedicalNotes] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [savedMedicalNotes, setSavedMedicalNotes] = useState<SavedTranscriptionEntry[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const lastSavedTranscriptionRef = useRef("");
  const controlsRef = useRef<{ start: () => void; stop: () => void; restart: () => void; pause: () => void; resume: () => void } | null>(null);

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
      <main className="relative min-h-screen px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl space-y-6 pb-10">
          <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-sky-700 px-6 py-8 text-white lg:px-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
                    <span className="material-symbols-outlined text-[18px]">clinical_notes</span>
                    Opération Endoscopie
                  </div>
                  <div className="space-y-2">
                    <h1 className="font-manrope text-3xl font-extrabold tracking-tight lg:text-4xl">Opération Endoscopie</h1>
                    <p className="max-w-2xl text-sm leading-6 text-blue-50/90 lg:text-base">
                      Étape intermédiaire du parcours clinique avec transcription vocale, prescriptions et suivi médical.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/checklists/avant"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15 active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    Retour Check-list Avant
                  </a>
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

          <section className="flex flex-col-reverse gap-3 rounded-3xl border border-slate-200/70 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="text-sm text-slate-500">
              Validation médicale, traçabilité des traitements et cohérence du protocole avant passage à l&apos;étape suivante.
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/checklists/avant"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                Retour Check-list Avant
              </a>
              <a
                href="/checklists/apres"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 hover:bg-blue-700"
              >
                Passer Check-list Après
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </a>
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
