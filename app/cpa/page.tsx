"use client";

import { AppShell } from "@/components/layout/AppShell";

export default function CPAPage() {
  return (
    <AppShell>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Back Button */}
        <a href="/prescriptions" className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/20 px-6 py-3 text-on-surface-variant hover:text-primary hover:border-primary transition-all">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span className="font-semibold">Retour au fil de prescription</span>
        </a>

        {/* Patient Profile Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-outline-variant/20 shadow-sm flex items-center gap-8 relative overflow-hidden">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl object-cover bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-4xl text-primary">person</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-black text-on-surface tracking-tight">MARIE LEFEBVRE</h2>
                <span className="bg-error/10 text-error text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    warning
                  </span>
                  STAT
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm font-semibold text-on-surface-variant">
                <span>ID: #PX-8829-01</span>
                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                <span>Femme, 72 ans</span>
                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                <span className="text-primary font-bold">Groupe A+</span>
              </div>
              <div className="mt-6 flex gap-12">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Poids</p>
                  <p className="text-lg font-bold text-on-surface">64.5 kg</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Dernier Repas</p>
                  <p className="text-lg font-bold text-error">À jeun (04:00 AM)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-secondary-container/20 p-8 rounded-2xl border border-secondary-container/30 relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Médecin Prescripteur</p>
                <h3 className="text-xl font-bold text-on-surface">Dr. Antoine Moreau</h3>
                <p className="text-xs text-on-surface-variant font-medium">Service de Gastro-entérologie</p>
              </div>
              <div className="pt-4 border-t border-secondary-container/40">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Examen Demandé</p>
                <p className="text-sm font-bold text-on-surface leading-snug">Fibroscopie Oeso-Gastro-Duodénale</p>
              </div>
            </div>
          </div>
        </div>

        {/* Anesthesia Choice */}
        <section className="rounded-3xl border-2 border-primary/20 bg-gradient-to-r from-primary/10 via-white to-tertiary/10 px-6 py-5 shadow-md shadow-primary/5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-error/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-error">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    priority_high
                  </span>
                  Obligatoire
                </span>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Choix d'anesthésie</p>
              </div>
              <p className="text-base font-semibold text-on-surface leading-snug">Le choix entre anesthésie locale et générale doit être fait avant validation de la demande.</p>
              <p className="text-sm text-on-surface-variant font-medium mt-2">Ce paramètre est requis pour poursuivre et déclencher le bon circuit de prise en charge.</p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-right">Sélection requise</p>
              <div className="flex items-center rounded-2xl border border-outline-variant/30 bg-surface-container p-1.5 shadow-inner">
                <button className="min-w-[11rem] px-6 py-3 rounded-xl text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
                  Anesthésie locale
                </button>
                <button className="min-w-[11rem] px-6 py-3 rounded-xl text-sm font-bold bg-white text-primary shadow-sm border border-outline-variant/10">
                  Anesthésie générale
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column: Clinical Context */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface-container p-8 rounded-2xl border border-outline-variant/10">
              <h4 className="font-bold text-on-surface mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">clinical_notes</span>
                Contexte Clinique
              </h4>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Motif de l'examen</p>
                  <div className="bg-white p-4 rounded-xl border border-outline-variant/10">
                    <p className="text-sm font-medium text-on-surface leading-relaxed">Hémorragie digestive haute - Suspicion d'ulcère gastrique.</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Historique Médical</p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-sm font-medium text-on-surface-variant">
                      <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                      Hypertension chronique
                    </li>
                    <li className="flex items-center gap-3 text-sm font-medium text-on-surface-variant">
                      <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                      Traitement anticoagulant (interrompu)
                    </li>
                    <li className="flex items-center gap-3 text-sm font-medium text-on-surface-variant">
                      <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                      Anémie ferriprive
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-tertiary-fixed p-8 rounded-2xl border-l-[6px] border-tertiary shadow-sm">
              <h4 className="font-bold text-on-tertiary-fixed mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  warning
                </span>
                Alertes Cliniques
              </h4>
              <div className="space-y-3">
                <p className="text-sm font-bold text-on-tertiary-fixed leading-relaxed">
                  Surveiller étroitement la saturation en O2.
                </p>
                <p className="text-sm font-bold text-on-tertiary-fixed leading-relaxed">
                  Réaction indésirable signalée au propofol en 2019.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: CPA Form */}
          <div className="lg:col-span-3">
            <section className="bg-white p-10 rounded-2xl border border-outline-variant/20 shadow-sm space-y-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-on-surface">Demande de CPA</h3>
                  <p className="text-[10px] text-on-surface-variant mt-1 uppercase tracking-[0.2em] font-bold">Consultation Pré-Anesthésique</p>
                </div>
                <div className="flex items-center gap-2 text-on-secondary-container bg-secondary-container/20 px-4 py-2 rounded-lg border border-secondary-container/20">
                  <span className="material-symbols-outlined text-lg">history_edu</span>
                  <span className="text-xs font-bold">Brouillon en cours</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.1em]">
                  Observations cliniques &amp; détails de l'intervention
                </label>
                <textarea
                  className="w-full min-h-[300px] bg-surface-container-low rounded-xl p-5 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/40 resize-none leading-relaxed border-none focus:ring-2 focus:ring-primary"
                  placeholder="Saisissez les antécédents, l'indication chirurgicale et les observations particulières..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/10">
                  <span className="material-symbols-outlined text-primary mb-3 block text-xl">person_search</span>
                  <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Demandeur</p>
                  <p className="text-sm font-black text-on-surface">Dr. Antoine Moreau</p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Service de Gastro-entérologie</p>
                </div>
                <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/10">
                  <span className="material-symbols-outlined text-primary mb-3 block text-xl font-bold">priority_high</span>
                  <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Urgence</p>
                  <p className="text-sm font-black text-on-surface">Standard (48h)</p>
                </div>
                <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/10">
                  <span className="material-symbols-outlined text-primary mb-3 block text-xl">calendar_today</span>
                  <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Date souhaitée</p>
                  <p className="text-sm font-black text-on-surface">12 Oct. 2023</p>
                </div>
              </div>

              <footer className="flex items-center justify-between pt-8 border-t border-outline-variant/10">
                <div className="flex items-center gap-4 text-on-surface-variant/80 max-w-[60%]">
                  <span className="material-symbols-outlined text-xl shrink-0">info</span>
                  <p className="text-xs leading-tight font-medium italic">La validation enverra une notification immédiate au service d'anesthésie.</p>
                </div>
                <div className="flex items-center gap-4">
                  <button className="px-6 py-3 rounded-xl text-sm font-bold text-on-surface bg-surface-container-high hover:bg-outline-variant/20 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">save</span>
                    Brouillon
                  </button>
                  <button className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg">send</span>
                    Valider la demande
                  </button>
                </div>
              </footer>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
