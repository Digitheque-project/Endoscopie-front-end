"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { DEFAULT_HEADER, HEADER_BY_PATH } from "@/components/layout/navigation";

export function TopHeader() {
  const pathname = usePathname();
  const header = HEADER_BY_PATH[pathname] ?? DEFAULT_HEADER;
  const isAgenda = pathname === "/agenda";
  const isPrescription = pathname === "/prescriptions";

  if (isAgenda) {
    return (
      <header className="fixed top-0 w-full z-40 justify-between items-center px-6 h-16 bg-slate-50 border-b border-slate-200/50 grid grid-cols-3">
        <div className="flex items-center gap-4 justify-start">
          <span className="font-manrope text-xl font-bold tracking-tight text-blue-800">Saint-Luc Clinic</span>
        </div>
        <div className="flex justify-center items-center">
          <div className="hidden md:flex items-center bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/20">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-sm w-64 placeholder:text-on-surface-variant/60"
              placeholder="Rechercher un patient ou un dossier..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 justify-end">
          <button className="p-2 text-slate-500 hover:bg-slate-200/50 transition-colors rounded-full relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/30">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-on-surface">Dr. Julian Reed</p>
              <p className="text-xs text-on-surface-variant">Gastro-entérologue</p>
            </div>
            <Image
              src="/assets/avatars/doctor-main.svg"
              alt="Dr. Julian Reed"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary-fixed"
              priority
            />
          </div>
        </div>
      </header>
    );
  }

  if (isPrescription) {
    return (
      <header className="fixed top-0 w-full z-40 justify-between items-center px-6 h-16 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-800/50 grid grid-cols-3">
        <div className="flex items-center gap-4 justify-start">
          <span className="font-manrope text-xl font-bold tracking-tight text-blue-800 dark:text-blue-300">{header.title}</span>
        </div>
        <div className="flex justify-center items-center">
          <div className="hidden md:flex items-center bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/20">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-sm w-64 placeholder:text-on-surface-variant/60"
              placeholder="Rechercher un patient ou un dossier..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 justify-end">
          <button className="p-2 text-slate-500 hover:bg-slate-200/50 transition-colors rounded-full relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/30">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-on-surface">Dr. Julian Reed</p>
              <p className="text-xs text-on-surface-variant">Gastro-entérologue</p>
            </div>
            <Image
              src="/assets/avatars/doctor-main.svg"
              alt="Dr. Julian Reed"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary-fixed"
              priority
            />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 lg:fixed lg:left-64 right-0 z-40 h-16 px-4 lg:px-8 flex items-center justify-between border-b border-outline-variant/30 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white shrink-0">
          <span className="material-symbols-outlined">{header.icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Unite Endoscopie</p>
          <h2 className="text-lg font-semibold text-on-surface leading-tight truncate">{header.title}</h2>
          <p className="text-[10px] text-on-surface-variant truncate">{header.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        <div className="relative hidden xl:block w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
            search
          </span>
          <input
            className="w-full bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/60"
            placeholder="Search patient, procedure, or medical ID..."
            type="text"
          />
        </div>

        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200/50 transition-colors text-on-surface-variant">
          <span className="material-symbols-outlined">notifications</span>
        </button>

        <div className="hidden sm:flex items-center gap-3">
          <div className="text-right hidden lg:block">
            <p className="text-xs font-bold text-on-surface">Dr. Claire Durand</p>
            <p className="text-[10px] text-on-surface-variant">Senior Gastroenterologist</p>
          </div>
          <Image
            src="/assets/avatars/doctor-main.svg"
            alt="Profil medecin"
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/10"
            priority
          />
        </div>
      </div>
    </header>
  );
}
