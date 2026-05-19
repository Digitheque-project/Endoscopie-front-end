"use client";

import React from "react";

type Entry = {
  id: string;
  content: string;
  timestamp: string;
};

export default function HistoryModal({ open, onClose, entries, onDelete }: { open: boolean; onClose: () => void; entries: Entry[]; onDelete?: (id: string) => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-4 max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="font-manrope text-lg font-semibold">Historique des transcriptions</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">Fermer</button>
        </div>
        <div className="max-h-[80vh] overflow-auto p-4">
          {entries.length === 0 ? (
            <div className="text-sm text-slate-500">Aucun élément historique.</div>
          ) : (
            <div className="space-y-3">
              {entries.map((e) => (
                <div key={e.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">{e.timestamp}</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700 leading-tight">{e.content}</p>
                    </div>
                    {onDelete && (
                      <button onClick={() => onDelete(e.id)} className="ml-3 text-slate-400 hover:text-red-600">Supprimer</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
