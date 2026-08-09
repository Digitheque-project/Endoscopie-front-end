"use client";

import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";

type Period = "week" | "month";

interface RapportStats {
  periode: { type: Period; start: string; end: string; label: string };
  totalPatients: number;
  parGenre: { homme: number; femme: number; enfant: number; nonRenseigne: number };
  parTypeExamen: { typeExamen: string; count: number }[];
}

function shiftDate(date: Date, period: Period, direction: 1 | -1): Date {
  const next = new Date(date);
  if (period === "month") {
    next.setMonth(next.getMonth() + direction);
  } else {
    next.setDate(next.getDate() + direction * 7);
  }
  return next;
}

export default function RapportPage() {
  const [period, setPeriod] = useState<Period>("week");
  const [refDate, setRefDate] = useState(() => new Date());
  const [stats, setStats] = useState<RapportStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    const dateParam = refDate.toISOString().split("T")[0];
    apiJson<RapportStats>(`/api/rapport/stats?period=${period}&date=${dateParam}`)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erreur de chargement du rapport.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period, refDate]);

  const totalGenre = stats
    ? stats.parGenre.homme + stats.parGenre.femme + stats.parGenre.enfant + stats.parGenre.nonRenseigne
    : 0;
  const maxExamCount = stats ? Math.max(1, ...stats.parTypeExamen.map((e) => e.count)) : 1;

  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        <section className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-low p-5 rounded-xl">
          <div className="flex items-center gap-2 bg-surface-container-lowest rounded-full p-1 border border-outline-variant/15">
            <button
              onClick={() => setPeriod("week")}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                period === "week" ? "bg-primary text-white" : "text-on-surface-variant"
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                period === "month" ? "bg-primary text-white" : "text-on-surface-variant"
              }`}
            >
              Mois
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setRefDate((d) => shiftDate(d, period, -1))}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-outline-variant/15 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high transition-colors"
              aria-label="Période précédente"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <p className="min-w-[16rem] text-center text-sm font-bold text-on-surface">
              {stats?.periode.label ?? "…"}
            </p>
            <button
              onClick={() => setRefDate((d) => shiftDate(d, period, 1))}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-outline-variant/15 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high transition-colors"
              aria-label="Période suivante"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <button
              onClick={() => setRefDate(new Date())}
              className="text-xs font-bold text-primary px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors"
            >
              Aujourd&apos;hui
            </button>
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-error/20 bg-error-container/10 p-6 text-center">
            <span className="material-symbols-outlined text-4xl text-error mb-2">cloud_off</span>
            <h4 className="text-lg font-bold text-error">Erreur de connexion</h4>
            <p className="text-on-surface-variant">{error}</p>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-primary text-white p-5 rounded-xl shadow-sm flex flex-col justify-between">
                <p className="text-sm font-medium opacity-80 mb-1">Patients reçus</p>
                <h3 className="text-4xl font-headline font-bold">
                  {isLoading ? "…" : stats?.totalPatients ?? 0}
                </h3>
                <p className="text-[10px] opacity-70 mt-1">Examens terminés (checklist après validée) sur la période</p>
              </div>

              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant/5 flex flex-col justify-between">
                <p className="text-sm text-on-surface-variant font-medium mb-1">Hommes</p>
                <h3 className="text-3xl font-headline font-bold text-on-surface">
                  {isLoading ? "…" : stats?.parGenre.homme ?? 0}
                </h3>
              </div>

              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant/5 flex flex-col justify-between">
                <p className="text-sm text-on-surface-variant font-medium mb-1">Femmes</p>
                <h3 className="text-3xl font-headline font-bold text-on-surface">
                  {isLoading ? "…" : stats?.parGenre.femme ?? 0}
                </h3>
              </div>

              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant/5 flex flex-col justify-between">
                <p className="text-sm text-on-surface-variant font-medium mb-1">Enfants</p>
                <h3 className="text-3xl font-headline font-bold text-on-surface">
                  {isLoading ? "…" : stats?.parGenre.enfant ?? 0}
                </h3>
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-5 space-y-4">
              <h4 className="font-headline font-bold text-on-surface">Examens par type</h4>

              {isLoading ? (
                <p className="text-sm text-on-surface-variant">Chargement…</p>
              ) : !stats || stats.parTypeExamen.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Aucun examen sur cette période.</p>
              ) : (
                <div className="space-y-3">
                  {stats.parTypeExamen.map((row) => (
                    <div key={row.typeExamen} className="flex items-center gap-4">
                      <p className="w-56 shrink-0 text-sm font-medium text-on-surface truncate">{row.typeExamen}</p>
                      <div className="flex-1 h-2.5 rounded-full bg-surface-container-high overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(row.count / maxExamCount) * 100}%` }}
                        />
                      </div>
                      <p className="w-10 text-right text-sm font-bold text-on-surface">{row.count}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {!isLoading && stats && stats.parGenre.nonRenseigne > 0 && (
              <p className="text-xs text-on-surface-variant">
                {stats.parGenre.nonRenseigne} patient(s) sans genre renseigné (non compté dans Hommes/Femmes/Enfants),
                sur {totalGenre} au total.
              </p>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
