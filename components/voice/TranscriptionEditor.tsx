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
        placeholder="La transcription apparaîtra ici..."
      />

      {/* History is rendered at page level to control order and modal */}
    </div>
  );
}
