import Image from "next/image";
import { AppShell } from "@/components/layout/AppShell";

export default function AgendaPage() {
  return (
    <AppShell>
      <div className="p-8 max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface">Planning de l'unite</h1>
            <p className="text-on-surface-variant font-medium mt-1">Lundi 24 Mai 2024</p>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-xl">
            <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-white shadow-sm text-primary">Journee</button>
            <button className="px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-white/50 transition-colors">
              Semaine
            </button>
          </div>
        </header>

        <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10">
          <div className="grid grid-cols-[100px_1fr_1fr] border-b border-outline-variant/15 bg-surface-container-high/40">
            <div className="p-4 border-r border-outline-variant/15" />
            <div className="p-4 border-r border-outline-variant/15 text-center">
              <span className="font-headline font-bold text-on-surface uppercase tracking-wider text-xs">Bloc Operatoire 01</span>
            </div>
            <div className="p-4 text-center">
              <span className="font-headline font-bold text-on-surface uppercase tracking-wider text-xs">Bloc Operatoire 02</span>
            </div>
          </div>

          <div className="relative min-h-[800px]">
            <div className="absolute inset-0 grid grid-rows-10 pointer-events-none">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="border-b border-outline-variant/10" />
              ))}
            </div>

            <div className="grid grid-cols-[100px_1fr_1fr] h-full relative z-10">
              <div className="flex flex-col border-r border-outline-variant/15 text-on-surface-variant text-[11px] font-semibold text-center pt-2">
                {[
                  "08:00",
                  "09:00",
                  "10:00",
                  "11:00",
                  "12:00",
                  "13:00",
                  "14:00",
                  "15:00",
                  "16:00",
                  "17:00",
                ].map((slot) => (
                  <div key={slot} className="h-20">
                    {slot}
                  </div>
                ))}
              </div>

              <div className="p-4 border-r border-outline-variant/15 relative">
                <div className="absolute top-4 left-4 right-4 bg-surface-container-lowest rounded-xl p-4 shadow-sm border-l-4 border-emerald-500 flex flex-col justify-between h-[72px]">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-on-surface leading-tight">Gastroscopie Diagnostique</h4>
                    <span className="bg-emerald-100 text-success text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      Complete
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium">
                    <span>M. Jean-Claude Bernard</span>
                    <span>08:00 - 08:45</span>
                  </div>
                </div>

                <div className="absolute top-[160px] left-4 right-4 bg-primary/5 rounded-xl p-4 shadow-sm border-l-4 border-primary flex flex-col justify-between h-[152px]">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-bold text-on-surface leading-tight">Coloscopie + Polypectomie</h4>
                      <span className="bg-primary-container text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                        En cours
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <Image
                        alt="Patient portrait"
                        className="w-6 h-6 rounded-full"
                        src="/assets/avatars/doctor-1.svg"
                        width={24}
                        height={24}
                      />
                      <span className="text-sm font-semibold">Mme. Sophie Marchand</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">medical_information</span> Dr. Leclerc
                    </span>
                    <span>10:00 - 11:30</span>
                  </div>
                </div>

                <div className="absolute top-[340px] left-4 right-4 bg-surface-container-lowest rounded-xl p-4 shadow-sm border-l-4 border-outline-variant/30 flex flex-col justify-between h-[72px]">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-on-surface leading-tight">Echo-endoscopie</h4>
                    <span className="bg-surface-container-highest text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      Prevu
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium">
                    <span>M. Robert Durand</span>
                    <span>12:15 - 13:00</span>
                  </div>
                </div>
              </div>

              <div className="p-4 relative">
                <div className="absolute top-[84px] left-4 right-4 bg-surface-container-lowest rounded-xl p-4 shadow-sm border-l-4 border-emerald-500 flex flex-col justify-between h-[72px]">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-on-surface leading-tight">Gastroscopie</h4>
                    <span className="bg-emerald-100 text-success text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      Complete
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium">
                    <span>Mme. Alice Petit</span>
                    <span>09:00 - 09:45</span>
                  </div>
                </div>

                <div className="absolute top-[200px] left-4 right-4 bg-tertiary-fixed rounded-xl p-4 shadow-sm border-l-4 border-tertiary flex flex-col justify-between h-[92px]">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-bold text-on-tertiary-fixed leading-tight">CPRE (Urgent)</h4>
                      <span className="bg-tertiary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                        Priorite
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-on-tertiary-fixed">M. Thomas Muller</p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-on-tertiary-fixed-variant font-bold">
                    <span>Dr. Girard</span>
                    <span>10:30 - 11:45</span>
                  </div>
                </div>

                <div className="absolute top-[400px] left-4 right-4 border-2 border-dashed border-outline-variant/30 rounded-xl h-24 flex items-center justify-center group">
                  <div className="flex flex-col items-center text-on-surface-variant/40 group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-3xl mb-1">add_circle</span>
                    <span className="text-xs font-bold uppercase tracking-widest">RESERVER UN CRENEAU</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">query_stats</span>
              </div>
              <h3 className="font-headline font-bold text-on-surface">Taux d'occupation</h3>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-headline font-extrabold text-on-surface">82%</span>
              <span className="text-sm font-semibold text-success flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">trending_up</span> +5%
              </span>
            </div>
            <div className="w-full bg-surface-container-highest h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: "82%" }} />
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-success-container text-success flex items-center justify-center">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <h3 className="font-headline font-bold text-on-surface">Actes Terminés</h3>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-headline font-extrabold text-on-surface">14</span>
              <span className="text-on-surface-variant text-sm font-medium">sur 22 prévus</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-4 font-medium italic">En avance de 15 minutes sur l'horaire</p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-tertiary-fixed text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <h3 className="font-headline font-bold text-on-surface">Alertes Labo</h3>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-headline font-extrabold text-on-surface">03</span>
              <button className="text-primary text-xs font-bold uppercase tracking-tighter hover:underline">Voir tout</button>
            </div>
            <div className="flex -space-x-2 mt-4">
              <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-container-highest flex items-center justify-center text-[10px] font-bold">
                JB
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-container-highest flex items-center justify-center text-[10px] font-bold">
                TM
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                +1
              </div>
            </div>
          </div>
        </div>
      </div>

      <a
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-primary to-primary-container text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-50 group"
        href="/"
      >
        <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
      </a>
    </AppShell>
  );
}
