"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { apiJson } from "@/lib/api";

interface ChecklistsProgress {
  avantTotal: number;
  avantValide: number;
  apresTotal: number;
  apresValide: number;
}

export default function ChecklistsPage() {
  const [progress, setProgress] = useState<ChecklistsProgress>({ avantTotal: 0, avantValide: 0, apresTotal: 0, apresValide: 0 });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await apiJson<ChecklistsProgress>("/api/checklists/progress-today");
        if (!cancelled && data) setProgress(data);
      } catch (err) {
        console.error("Erreur chargement progression checklists :", err);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const avantPct = progress.avantTotal > 0 ? Math.round((progress.avantValide / progress.avantTotal) * 100) : 0;
  const apresPct = progress.apresTotal > 0 ? Math.round((progress.apresValide / progress.apresTotal) * 100) : 0;

  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        <PageToolbar
          actions={
            <>
              <Link href="/checklists/avant" className="px-4 py-2 rounded-lg bg-primary text-white font-semibold shadow-sm">
                Ouvrir la phase 1
              </Link>
              <Link
                href="/checklists/apres"
                className="px-4 py-2 rounded-lg border border-outline-variant/20 font-semibold text-on-surface-variant hover:bg-surface-container-low"
              >
                Ouvrir la phase 2
              </Link>
            </>
          }
        >
        </PageToolbar>

        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/checklists/avant"
            className="bg-white rounded-xl p-5 shadow-sm border border-outline-variant/10 hover:bg-surface-container-low transition-colors"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">fact_check</span>
              </div>
              <h2 className="font-headline text-xl font-bold">1. Avant l&apos;endoscopie</h2>
            </div>
            <p className="text-sm text-on-surface-variant">Verification identite, consentement, materiel et preparation du patient.</p>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {progress.avantValide}/{progress.avantTotal} validées aujourd&apos;hui
            </p>
            <div className="mt-2 h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-primary-container" style={{ width: `${avantPct}%` }} />
            </div>
          </Link>

          <Link
            href="/checklists/apres"
            className="bg-white rounded-xl p-5 shadow-sm border border-outline-variant/10 hover:bg-surface-container-low transition-colors"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-secondary-container/30 text-on-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined">fact_check</span>
              </div>
              <h2 className="font-headline text-xl font-bold">2. Apres l&apos;endoscopie</h2>
            </div>
            <p className="text-sm text-on-surface-variant">Surveillance post-acte, prescriptions, validation et traçabilité.</p>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {progress.apresValide}/{progress.apresTotal} validées aujourd&apos;hui
            </p>
            <div className="mt-2 h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-secondary to-primary-container" style={{ width: `${apresPct}%` }} />
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
