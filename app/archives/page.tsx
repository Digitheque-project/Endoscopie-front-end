import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { PageToolbar } from "@/components/layout/PageToolbar";

export default function ArchivesPage() {
  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        <PageToolbar>
          <p className="text-on-surface-variant font-medium">
            Historique et dossiers patients.
          </p>
        </PageToolbar>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-outline-variant/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline text-xl font-bold">Recherche archive</h2>
            <button className="px-4 py-2 rounded-lg border border-outline-variant/20 text-sm font-semibold">
              Exporter
            </button>
          </div>
          <p className="text-sm text-on-surface-variant">
            Ecran migre en App Router. Le detail complet du prototype sera integre a
            l&apos;etape suivante.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
