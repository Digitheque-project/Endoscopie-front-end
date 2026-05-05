import { AppShell } from "@/components/layout/AppShell";

export default function ArchivesPage() {
  return (
    <AppShell>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-headline font-extrabold tracking-tight">Archives</h1>
          <p className="text-on-surface-variant mt-1">Historique et dossiers patients.</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-outline-variant/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline text-xl font-bold">Recherche archive</h2>
            <button className="px-4 py-2 rounded-lg border border-outline-variant/20 text-sm font-semibold">Exporter</button>
          </div>
          <p className="text-sm text-on-surface-variant">Ecran migre en App Router. Le detail complet du prototype sera integre a l'etape suivante.</p>
        </div>
      </div>
    </AppShell>
  );
}
