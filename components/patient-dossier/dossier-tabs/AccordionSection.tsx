"use client";

import { useState } from "react";

interface AccordionSectionProps {
  number: string;
  title: string;
  subtitle?: string;
  isComplete?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * Section numérotée repliable — vocabulaire visuel commun à tous les onglets du dossier
 * patient (Observation, Diagnostic, Suivi...), pour rester cohérent même quand un onglet
 * n'a qu'une ou deux sections.
 */
export function AccordionSection({ number, title, subtitle, isComplete, defaultOpen = false, children }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-outline-variant/20 overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-container-low transition-all text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
            {number}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-on-surface truncate">{title}</p>
            {subtitle && !open && <p className="text-[11px] text-on-surface-variant truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isComplete ? (
            <span className="w-6 h-6 rounded-full bg-success-container text-success flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">check</span>
            </span>
          ) : (
            <span className="w-5 h-5 rounded-full border-2 border-outline-variant/40" />
          )}
          <span className="material-symbols-outlined text-on-surface-variant">{open ? "expand_less" : "expand_more"}</span>
        </div>
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-outline-variant/10 space-y-3">{children}</div>}
    </div>
  );
}
