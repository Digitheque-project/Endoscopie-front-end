"use client";

import React, { useState } from "react";

export type SavedTranscriptionEntry = {
  id: string;
  content: string;
  timestamp: string;
};

type Props = {
  text: string;
  onChange: (val: string) => void;
  onSave: () => void;
  onCancel?: () => void;
  onClear?: () => void;
  onSaveTranscription?: (text: string) => void;
  savedTranscriptions?: SavedTranscriptionEntry[];
  onDeleteSavedTranscription?: (id: string) => void;
};

export default function TranscriptionEditor({ text, onChange, onSave, onCancel, onClear, onSaveTranscription, savedTranscriptions = [], onDeleteSavedTranscription }: Props) {
  const [showHistory, setShowHistory] = useState(false);

  const handleSaveTranscription = () => {
    const normalized = text.trim();
    if (!normalized) return;
    onSaveTranscription?.(normalized);
  };

  const handleDeleteFromHistory = (id: string) => {
    onDeleteSavedTranscription?.(id);
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <h3 className="font-manrope text-base font-bold text-slate-900">Transcription vocale</h3>
      </div>

      <textarea
        className="w-full min-h-[160px] rounded-2xl border border-slate-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
        value={text}
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="mt-3 flex flex-wrap gap-3">
        <button onClick={handleSaveTranscription} type="button" className="rounded-2xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors">Enregistrer la transcription</button>
        <button onClick={onSave} type="button" className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">Ajouter aux notes médicales</button>
        <button onClick={onClear} type="button" className="rounded-2xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 transition-colors">Effacer transcription</button>
      </div>

      {/* History is rendered at page level to control order and modal */}
    </div>
  );
}
