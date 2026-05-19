"use client";

import { AppShell } from "@/components/layout/AppShell";
import { useState, useMemo } from "react";

export default function PlanificationPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const formattedCurrentDate = useMemo(() => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).replace(/^\w/, (c) => c.toUpperCase());
  }, [date]);
  return (
    <AppShell>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        {/* Back Button */}
        <a href="/prescriptions" className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/20 px-6 py-3 text-on-surface-variant hover:text-primary hover:border-primary transition-all">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span className="font-semibold">Retour au fil de prescription</span>
        </a>

        {/* Patient Header */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white rounded-xl border border-outline-variant/30 p-6 flex gap-6 items-start shadow-sm">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-container flex-shrink-0">
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-primary">person</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">MARIE LEFEBVRE</h3>
                  <p className="text-on-surface-variant font-medium flex items-center gap-2 text-sm mt-0.5">
                    <span className="text-primary font-bold">ID: #PX-8829-01</span> • Femme, 72 ans • A+
                  </p>
                </div>
                <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1 uppercase shadow-sm">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    warning
                  </span>
                  STAT
                </span>
              </div>
              <div className="mt-4 flex gap-12">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Poids</p>
                  <p className="text-sm font-bold">64.5 kg</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Dernier repas</p>
                  <p className="text-sm font-bold text-error">À jeun (04:00 AM)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-secondary-fixed p-6 rounded-xl flex flex-col justify-between border border-outline-variant/10 shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-on-secondary-fixed-variant uppercase tracking-wider mb-1">MÉDECIN PRESCRIPTEUR</p>
              <p className="font-headline font-bold text-on-secondary-fixed text-lg">Dr. Antoine Moreau</p>
              <p className="text-xs text-on-secondary-fixed-variant font-medium">Service de Gastro-entérologie</p>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-bold text-on-secondary-fixed-variant uppercase tracking-wider mb-1">EXAMEN DEMANDÉ</p>
              <p className="text-sm font-bold text-on-secondary-fixed leading-tight">Fibroscopie Oeso-Gastro-Duodénale</p>
            </div>
          </div>
        </section>

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
              <p className="text-base font-semibold text-on-surface leading-snug">Sélectionnez l'anesthésie avant de finaliser la planification du créneau.</p>
              <p className="text-sm text-on-surface-variant font-medium mt-2">Ce choix conditionne la suite du parcours et doit rester visible à tout moment.</p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-right">Sélection requise</p>
              <div className="flex items-center rounded-2xl border border-outline-variant/30 bg-surface-container p-1.5 shadow-inner">
                <button className="min-w-[11rem] px-6 py-3 rounded-xl text-sm font-semibold bg-white text-primary shadow-sm border border-outline-variant/10 transition-all">
                  Anesthésie locale
                </button>
                <button className="min-w-[11rem] px-6 py-3 rounded-xl text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors">
                  Anesthésie générale
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Context */}
          <div className="lg:col-span-5 space-y-6">
            {/* Clinical Context */}
            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/20 shadow-sm">
              <h4 className="font-headline font-bold text-on-surface mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">clinical_notes</span>
                Contexte Clinique
              </h4>
              <div className="space-y-5">
                <div className="bg-white p-4 rounded-lg border border-outline-variant/10">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">MOTIF DE L'EXAMEN</p>
                  <p className="text-sm text-on-surface font-medium leading-relaxed">Hémorragie digestive haute - Suspicion d'ulcère gastrique.</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">HISTORIQUE MÉDICAL</p>
                  <ul className="text-sm space-y-2 text-on-surface-variant font-medium">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                      Hypertension chronique
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                      Traitement anticoagulant (interrompu)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                      Anémie ferriprive
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-tertiary-fixed p-6 rounded-xl border-l-4 border-tertiary shadow-sm">
              <h4 className="font-headline font-bold text-on-tertiary-fixed mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">assignment_late</span>
                Alertes Cliniques
              </h4>
              <p className="text-sm text-on-tertiary-fixed-variant leading-relaxed font-semibold">
                Surveiller étroitement la saturation en O2. Réaction indésirable signalée au propofol en 2019.
              </p>
            </div>
          </div>

          {/* Right Column: Planning Form */}
          <div className="lg:col-span-7">
            <div className="bg-white p-8 rounded-xl border border-outline-variant/30 shadow-md space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">Planification du créneau</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-primary text-sm">calendar_today</span>
                  <p className="text-sm font-bold text-primary">{formattedCurrentDate}</p>
                  <button 
                    onClick={() => setDate(new Date().toISOString().split('T')[0])}
                    className="ml-2 px-2 py-0.5 rounded-md bg-primary/10 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/20 transition-all"
                  >
                    Aujourd'hui
                  </button>
                </div>
                <p className="text-sm text-on-surface-variant mt-1.5 font-medium">Étape 2 sur 3 : Sélection des ressources</p>
              </div>
              <span className="text-[10px] font-black bg-surface-container px-3 py-1 rounded-full uppercase tracking-widest text-on-surface-variant">PLANNING</span>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">CHIRURGIEN SÉLECTIONNÉ</label>
                  <select className="w-full appearance-none bg-surface-container-low border-b-2 border-outline-variant focus:border-primary px-4 py-3.5 rounded-t-lg text-sm font-bold text-on-surface transition-all focus:ring-0">
                    <option>Dr. Elena Rodriguez</option>
                    <option>Dr. Marc Vernet</option>
                    <option>Dr. Sarah Jenkins</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">SALLE D'OPÉRATION (BLOC)</label>
                  <div className="flex gap-2 h-[48px]">
                    <button className="flex-1 text-xs font-black rounded-lg border-2 border-primary text-primary bg-primary-container/10 transition-all">
                      Bloc 1
                    </button>
                    <button className="flex-1 text-xs font-bold rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all">
                      Bloc 2
                    </button>
                    <button className="flex-1 text-xs font-bold rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all">
                      Bloc 3
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">
                  CRÉNEAUX DISPONIBLES (AUJOURD'HUI, 24 OCT.)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button className="py-3.5 rounded-lg bg-surface-container text-on-surface-variant text-sm font-bold opacity-40 cursor-not-allowed">
                    08:30
                  </button>
                  <button className="py-3.5 rounded-lg bg-primary text-on-primary text-sm font-bold shadow-lg shadow-primary/20 ring-2 ring-primary ring-offset-2 transform scale-105 transition-all">
                    09:15
                  </button>
                  <button className="py-3.5 rounded-lg bg-surface-container-low border border-outline-variant/10 text-on-surface text-sm font-bold hover:bg-primary-container/10 hover:text-primary transition-all">
                    10:00
                  </button>
                  <button className="py-3.5 rounded-lg bg-surface-container-low border border-outline-variant/10 text-on-surface text-sm font-bold hover:bg-primary-container/10 hover:text-primary transition-all">
                    11:30
                  </button>
                  <button className="py-3.5 rounded-lg bg-surface-container-low border border-outline-variant/10 text-on-surface text-sm font-bold hover:bg-primary-container/10 hover:text-primary transition-all">
                    13:45
                  </button>
                  <button className="py-3.5 rounded-lg bg-surface-container-low border border-outline-variant/10 text-on-surface text-sm font-bold hover:bg-primary-container/10 hover:text-primary transition-all">
                    14:30
                  </button>
                  <button className="py-3.5 rounded-lg bg-surface-container-low border border-outline-variant/10 text-on-surface text-sm font-bold hover:bg-primary-container/10 hover:text-primary transition-all">
                    15:15
                  </button>
                  <button className="py-3.5 rounded-lg bg-surface-container-low border border-outline-variant/10 text-on-surface text-sm font-bold hover:bg-primary-container/10 hover:text-primary transition-all">
                    16:00
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.1em]">
                  Observations cliniques &amp; détails de l'intervention
                </label>
                <textarea
                  className="w-full min-h-[200px] bg-surface-container-low rounded-xl p-5 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/40 resize-none leading-relaxed border-none focus:ring-2 focus:ring-primary"
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
                  <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Urgent</p>
                  <p className="text-sm font-black text-on-surface">Standard (48h)</p>
                </div>
                <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/10">
                  <span className="material-symbols-outlined text-primary mb-3 block text-xl">calendar_today</span>
                  <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Date souhaitée</p>
                  <p className="text-sm font-black text-on-surface">12 Oct. 2023</p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-surface border border-dashed border-outline-variant/40 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      event_available
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">RENDEZ-VOUS SÉLECTIONNÉ</p>
                    <p className="text-base font-extrabold text-on-surface">Jeudi 24 oct. • 09:15 • Bloc 1</p>
                    <p className="text-xs text-on-surface-variant font-medium">Anesthésie locale sélectionnée</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <button className="flex-1 md:flex-none px-6 py-3 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-all">
                    Annuler
                  </button>
                  <button className="flex-[2] md:flex-none px-10 py-3 rounded-lg text-sm font-bold text-on-primary bg-primary shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all text-center">
                    Confirmer le RDV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
