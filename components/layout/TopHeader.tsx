"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { DEFAULT_HEADER, HEADER_BY_PATH } from "@/components/layout/navigation";
import { NotificationBell } from "@/components/layout/NotificationBell";

const HIDE_UNIT_LABEL_PATHS = new Set(["/", "/demande-cpa"]);

export function TopHeader() {
  const pathname = usePathname();
  const header = HEADER_BY_PATH[pathname] ?? DEFAULT_HEADER;
  const hideUnitLabel =
    HIDE_UNIT_LABEL_PATHS.has(pathname) || pathname.startsWith("/patient-dossier");

  return (
    <header className="sticky top-0 lg:fixed lg:left-64 right-0 z-40 h-16 px-4 lg:px-8 flex items-center justify-between border-b border-outline-variant/30 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white shrink-0">
          <span className="material-symbols-outlined">{header.icon}</span>
        </div>
        <div className="min-w-0">
          {!hideUnitLabel && (
            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
              Unite Endoscopie
            </p>
          )}
          <h2 className="text-lg font-semibold text-on-surface leading-tight truncate">
            {header.title}
          </h2>
          {header.subtitle ? (
            <p className="text-[10px] text-on-surface-variant truncate hidden sm:block">
              {header.subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        <div className="relative hidden xl:block w-full max-w-xl">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary text-2xl font-bold">
            search
          </span>
          <input
            className="w-full bg-white border-2 border-primary rounded-2xl pl-12 pr-4 py-3 text-sm transition-all hover:ring-4 hover:ring-primary/10 focus:ring-4 focus:ring-primary/20 text-on-surface placeholder:text-slate-400 font-bold shadow-md outline-none"
            placeholder="Rechercher un patient, une procédure ou un identifiant..."
            type="text"
          />
        </div>

        <NotificationBell />

        <div className="hidden sm:flex items-center gap-3 pl-3 lg:pl-4 border-l border-outline-variant/30">
          <div className="text-right hidden lg:block">
            <p className="text-xs font-bold text-on-surface">Dr. Claire Durand</p>
            <p className="text-[10px] text-on-surface-variant">Gastro-entérologue</p>
          </div>
          <Image
            src="/assets/avatars/doctor-main.svg"
            alt="Dr. Claire Durand"
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
