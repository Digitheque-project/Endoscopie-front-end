import Link from "next/link";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { PageToolbar } from "@/components/layout/PageToolbar";

export default function ChecklistsPage() {
  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        <PageToolbar
          actions={
            <>
              <Link
                href="/checklists/avant"
                className="px-4 py-2 rounded-lg bg-primary text-white font-semibold shadow-sm"
              >
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
          <p className="text-on-surface-variant font-medium">
            Pilotage des etapes de preparation avant et apres l&apos;endoscopie.
          </p>
        </PageToolbar>

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/checklists/avant" className="bg-white rounded-xl p-6 shadow-sm border border-outline-variant/10 hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">fact_check</span>
              </div>
              <h2 className="font-headline text-xl font-bold">1. Avant l'endoscopie</h2>
            </div>
            <p className="text-sm text-on-surface-variant">Verification identite, consentement, materiel et preparation du patient.</p>
            <div className="mt-6 h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-primary to-primary-container" />
            </div>
          </Link>

          <Link href="/checklists/apres" className="bg-white rounded-xl p-6 shadow-sm border border-outline-variant/10 hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-secondary-container/30 text-on-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined">fact_check</span>
              </div>
              <h2 className="font-headline text-xl font-bold">2. Apres l'endoscopie</h2>
            </div>
            <p className="text-sm text-on-surface-variant">Surveillance post-acte, prescriptions, validation et traçabilité.</p>
            <div className="mt-6 h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-gradient-to-r from-secondary to-primary-container" />
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
