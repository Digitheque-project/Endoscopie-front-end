"use client";

import { AppShell } from "@/components/layout/AppShell";

export default function PatientDossierPage() {
  return (
    <AppShell>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Back Button */}
        <a href="/patients" className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-white px-5 py-3 text-sm font-bold text-on-surface-variant shadow-sm transition-all hover:border-primary hover:text-primary hover:shadow-md">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span>Retour à la liste des patients</span>
        </a>

        {/* Patient Header */}
        <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-4xl">person</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Patient</p>
              <h2 className="font-headline text-3xl font-extrabold tracking-tight">Jean-Pierre Dubois</h2>
              <p className="text-sm text-on-surface-variant mt-1">Né le 14/05/1958 • 65 ans • ID #END-9821</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-secondary-container text-secondary text-xs font-bold uppercase tracking-wider">Coloscopie diagnostique</span>
                <span className="px-3 py-1 rounded-full bg-tertiary-fixed text-tertiary text-xs font-bold uppercase tracking-wider">Préparation en cours</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
            <a href="/checklists/avant" className="px-5 py-3 rounded-xl bg-primary text-white font-bold text-sm text-center hover:opacity-90 transition-opacity">
              Démarrer checklist
            </a>
            <a href="/planification" className="px-5 py-3 rounded-xl border border-outline-variant/40 text-on-surface-variant font-bold text-sm text-center hover:bg-surface-container-low transition-colors">
              Planifier l'examen
            </a>
          </div>
        </section>

        {/* Info Cards */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Statut</p>
            <p className="text-2xl font-headline font-bold">Prêt pour la phase pré-opératoire</p>
            <p className="text-sm text-on-surface-variant">Le dossier est accessible depuis tous les modules pour relier la préparation, la procédure et le compte-rendu.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Équipe</p>
            <p className="text-lg font-bold">Dr. Morel</p>
            <p className="text-sm text-on-surface-variant">Anesthésiste référent</p>
            <p className="text-sm text-on-surface-variant">M. Lucas • IADE</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Actions rapides</p>
            <a href="/cpa" className="block px-4 py-2 rounded-lg bg-surface-container-low text-primary font-bold text-sm hover:bg-surface-container transition-colors">
              Demande CPA / image
            </a>
            <a href="/rapport" className="block px-4 py-2 rounded-lg bg-surface-container-low text-primary font-bold text-sm hover:bg-surface-container transition-colors">
              Voir le rapport
            </a>
          </div>
        </section>

        {/* Parcours de soins */}
        <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline text-xl font-bold">Parcours de soins</h3>
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Navigation réelle</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/agenda" className="rounded-xl border border-outline-variant/20 p-4 hover:bg-surface-container-low transition-colors">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Étape 1</p>
              <p className="font-bold mt-1">Agenda / Rendez-vous</p>
            </a>
            <a href="/checklists/avant" className="rounded-xl border border-outline-variant/20 p-4 hover:bg-surface-container-low transition-colors">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Étape 2</p>
              <p className="font-bold mt-1">Check-list avant</p>
            </a>
            <a href="/checklists/apres" className="rounded-xl border border-outline-variant/20 p-4 hover:bg-surface-container-low transition-colors">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Étape 3</p>
              <p className="font-bold mt-1">Check-list après</p>
            </a>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
