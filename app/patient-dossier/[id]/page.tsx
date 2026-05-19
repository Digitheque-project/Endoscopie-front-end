"use client";

import { AppShell } from "@/components/layout/AppShell";
import { useParams } from "next/navigation";

export default function PatientDossierPage() {
  const params = useParams();
  const id = params?.id ? decodeURIComponent(params.id as string) : "#END-9821";

  return (
    <AppShell>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Back Button */}
        <a href="/prescriptions" className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-white px-5 py-3 text-sm font-bold text-on-surface-variant shadow-sm transition-all hover:border-primary hover:text-primary hover:shadow-md">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span>Retour à la liste des prescriptions</span>
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
              <p className="text-sm text-on-surface-variant mt-1">Né le 14/05/1958 • 65 ans • ID {id}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-secondary-container text-secondary text-xs font-bold uppercase tracking-wider">Coloscopie diagnostique</span>
                <span className="px-3 py-1 rounded-full bg-tertiary-fixed text-tertiary text-xs font-bold uppercase tracking-wider">Préparation en cours</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
            <a href={`/checklists/avant?patientId=${encodeURIComponent(id)}`} className="px-5 py-3 rounded-xl bg-primary text-white font-bold text-sm text-center hover:opacity-90 transition-opacity shadow-md hover:scale-105 active:scale-95 duration-200">
              Démarrer checklist
            </a>
            <a href={`/planification-examens?patientId=${encodeURIComponent(id)}`} className="px-5 py-3 rounded-xl border border-outline-variant/40 text-on-surface-variant font-bold text-sm text-center hover:bg-surface-container-low transition-all hover:scale-105 active:scale-95 duration-200">
              Planifier l'examen
            </a>
          </div>
        </section>

        {/* Info Cards */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">DETAIL DE LA PRESCRIPTION</p>
            
            <div className="space-y-6 text-sm text-on-surface-variant overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              <section>
                <h4 className="font-bold text-on-surface mb-2 border-b border-outline-variant/10 pb-1">Motif de la demande</h4>
                <p className="mb-2">Patiente présentant :</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>rectorragies intermittentes depuis 3 mois ;</li>
                  <li>douleurs abdominales basses ;</li>
                  <li>troubles du transit avec alternance constipation/diarrhée ;</li>
                  <li>anémie ferriprive récente.</li>
                </ul>
                <p className="mt-2 italic font-medium text-primary">Suspicion de pathologie colique nécessitant exploration diagnostique.</p>
              </section>

              <section>
                <h4 className="font-bold text-on-surface mb-2 border-b border-outline-variant/10 pb-1">Examen demandé</h4>
                <p className="font-bold text-lg text-primary">Coloscopie diagnostique</p>
              </section>

              <section>
                <h4 className="font-bold text-on-surface mb-2 border-b border-outline-variant/10 pb-1">Objectifs de l’examen</h4>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Recherche de polypes coliques ;</li>
                  <li>Recherche d’une tumeur colo-rectale ;</li>
                  <li>Détection d’une maladie inflammatoire intestinale ;</li>
                  <li>Identification d’une source de saignement digestif bas ;</li>
                  <li>Réalisation de biopsies si nécessaire.</li>
                </ul>
              </section>

              <section>
                <h4 className="font-bold text-on-surface mb-2 border-b border-outline-variant/10 pb-1">Antécédents médicaux</h4>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Hypertension artérielle contrôlée</li>
                  <li>Antécédent familial de cancer colorectal</li>
                  <li>Pas d’allergie médicamenteuse connue</li>
                </ul>
              </section>

              <section>
                <h4 className="font-bold text-on-surface mb-2 border-b border-outline-variant/10 pb-1">Traitements en cours</h4>
                <ul className="list-disc ml-5 space-y-1 text-secondary font-medium">
                  <li>Amlodipine 5 mg/j</li>
                  <li>Aspirine 100 mg/j</li>
                </ul>
              </section>

              <section className="bg-amber-50 p-3 rounded-xl border border-amber-200/50">
                <h4 className="font-bold text-amber-900 mb-1 text-xs uppercase tracking-wider">Gestion des antiagrégants / anticoagulants</h4>
                <p className="text-amber-800 font-semibold italic">
                  Avis spécialisé demandé avant arrêt éventuel de l’aspirine.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-on-surface mb-2 border-b border-outline-variant/10 pb-1">Préparation colique prescrite</h4>
                <p className="font-bold text-primary mb-1">Préparation digestive</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Régime sans résidus 3 jours avant l’examen ;</li>
                  <li>Liquides clairs uniquement la veille ;</li>
                  <li>Préparation colique par PEG selon protocole du service.</li>
                </ul>
              </section>

              <section className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                <h4 className="font-bold text-primary mb-2 text-xs uppercase tracking-wider">Consignes au patient</h4>
                <ul className="list-disc ml-5 space-y-2 font-medium">
                  <li>Être strictement à jeun avant l’examen ;</li>
                  <li>Venir accompagné si sédation prévue ;</li>
                  <li>Apporter les bilans biologiques récents ;</li>
                  <li>Signaler tout traitement anticoagulant, diabète ou allergie.</li>
                </ul>
              </section>
            </div>
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
            <a href={`/checklists/avant?patientId=${encodeURIComponent(id)}`} className="rounded-xl border border-outline-variant/20 p-4 hover:bg-surface-container-low transition-colors">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Étape 2</p>
              <p className="font-bold mt-1">Check-list avant</p>
            </a>
            <a href={`/checklists/apres?patientId=${encodeURIComponent(id)}`} className="rounded-xl border border-outline-variant/20 p-4 hover:bg-surface-container-low transition-colors">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Étape 3</p>
              <p className="font-bold mt-1">Check-list après</p>
            </a>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
