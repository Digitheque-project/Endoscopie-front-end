"use client";

import { getExamTypeBadgeClass } from "@/lib/exam-type-colors";
import { capitalizeFirst } from "@/components/voice/formatTranscript";

export type ProcedureCount = {
  procedure: string;
  count: number;
};

type ProcedureCountsCardProps = {
  procedureCounts: ProcedureCount[];
  isLoading: boolean;
};

export default function ProcedureCountsCard({
  procedureCounts,
  isLoading,
}: ProcedureCountsCardProps) {
  const totalProceduresToday = procedureCounts.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="col-span-12 md:col-span-8 bg-white p-3.5 rounded-xl border border-outline-variant/10 shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <p className="text-on-surface-variant text-xs font-semibold">
          Total des procédures aujourd&apos;hui
        </p>
        <div className="w-7 h-7 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined text-sm">clinical_notes</span>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-6 w-10 rounded bg-surface-container" />
          <div className="h-3 w-3/4 rounded bg-surface-container" />
        </div>
      ) : (
        <div>
          <h3 className="text-2xl font-extrabold text-on-surface leading-none">
            {totalProceduresToday.toString().padStart(2, '0')}
          </h3>
          {procedureCounts.length > 0 ? (
            <div className="mt-1.5 flex max-h-10 flex-wrap gap-1 overflow-y-auto scrollbar-thin scrollbar-thumb-outline-variant/30 scrollbar-track-transparent">
              {procedureCounts.map(({ procedure, count }) => (
                <span
                  key={procedure}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${getExamTypeBadgeClass(procedure)}`}
                >
                  {count} {capitalizeFirst(procedure)}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-[11px] text-on-surface-variant">
              Aucune procédure programmée aujourd&apos;hui.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
