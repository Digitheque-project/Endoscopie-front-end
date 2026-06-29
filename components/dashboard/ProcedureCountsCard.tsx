"use client";

import { Fragment } from "react";

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
    <div className="col-span-12 md:col-span-6 bg-white p-5 rounded-xl border border-outline-variant/10 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-on-surface-variant text-sm font-semibold">
          Total des procédures aujourd&apos;hui
        </p>
        <div className="w-9 h-9 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined text-lg">clinical_notes</span>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-8 w-12 rounded bg-surface-container" />
          <div className="h-3 w-3/4 rounded bg-surface-container" />
        </div>
      ) : (
        <div>
          <h3 className="text-3xl font-extrabold text-on-surface leading-none">
            {totalProceduresToday.toString().padStart(2, '0')}
          </h3>
          {procedureCounts.length > 0 ? (
            <p className="mt-2 max-h-12 overflow-y-auto text-xs leading-relaxed text-on-surface-variant scrollbar-thin scrollbar-thumb-outline-variant/30 scrollbar-track-transparent">
              {procedureCounts.map(({ procedure, count }, index) => (
                <Fragment key={procedure}>
                  <span className="font-bold text-on-surface">{count}</span> {procedure}
                  {index < procedureCounts.length - 1 && (
                    <span className="mx-1.5 text-outline-variant">•</span>
                  )}
                </Fragment>
              ))}
            </p>
          ) : (
            <p className="mt-2 text-xs text-on-surface-variant">
              Aucune procédure programmée aujourd&apos;hui.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
