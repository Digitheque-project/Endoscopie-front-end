"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CHECKLIST_LINKS, MAIN_LINKS } from "@/components/layout/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const isAgendaOrPrescription = pathname === "/agenda" || pathname === "/prescriptions";

  const isActive = (href: string, matchPrefix?: boolean) => {
    if (href === "/") {
      return pathname === "/";
    }

    return matchPrefix ? pathname.startsWith(href) : pathname === href;
  };

  return (
    <aside
      className={[
        "hidden lg:flex fixed left-0 z-50 backdrop-blur-xl flex-col",
        isAgendaOrPrescription
          ? "top-16 h-[calc(100vh-64px)] w-72 bg-[#f3f3f7] py-6 space-y-2 border-r border-[#c2c6d4]/15"
          : "w-64 bg-slate-100/50 p-4 space-y-2",
      ].join(" ")}
    >
      <div className={isAgendaOrPrescription ? "px-8 mb-8" : "flex items-center gap-3 mb-8 px-2"}>
        <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center text-white">
          <span className="material-symbols-outlined">{isAgendaOrPrescription ? "local_hospital" : "clinical_notes"}</span>
        </div>
        <div className="ml-3">
          <h1 className="font-manrope font-extrabold text-blue-800 leading-tight text-sm">
            {isAgendaOrPrescription ? "Saint-Luc Clinic" : "Unite Endoscopie"}
          </h1>
          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
            {isAgendaOrPrescription ? "Unité d'Endoscopie" : "personnel de service endoscopie"}
          </p>
        </div>
      </div>

      <nav className={isAgendaOrPrescription ? "flex-1" : "flex-1 space-y-1"}>
        {MAIN_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={[
              isAgendaOrPrescription
                ? "mx-4 flex items-center gap-3 p-3 rounded-lg transition-all text-sm font-medium"
                : "flex items-center gap-3 p-3 rounded-lg transition-all font-inter text-sm font-semibold",
              isActive(link.href, link.matchPrefix)
                ? isAgendaOrPrescription
                  ? "bg-white text-[#005EB8] shadow-sm"
                  : "bg-white text-blue-700 shadow-sm"
                : isAgendaOrPrescription
                  ? "text-[#424752] hover:bg-white/40"
                  : "text-slate-600 hover:bg-slate-200",
            ].join(" ")}
          >
            <span className={isAgendaOrPrescription ? "material-symbols-outlined text-xl" : "material-symbols-outlined"}>{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}

        <div className={isAgendaOrPrescription ? "" : "ml-4 mt-1 flex flex-col space-y-1"}>
          {CHECKLIST_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={[
                isAgendaOrPrescription
                  ? "mx-4 flex items-center gap-3 p-2 rounded-lg transition-all text-sm font-medium"
                  : "flex items-center gap-3 p-2 rounded-lg transition-all text-sm font-medium",
                isActive(link.href)
                  ? isAgendaOrPrescription
                    ? "bg-white text-[#005EB8] shadow-sm"
                    : "bg-white text-blue-700 shadow-sm"
                  : isAgendaOrPrescription
                    ? "text-[#424752] hover:bg-white/40"
                    : "text-slate-500 hover:bg-slate-200",
              ].join(" ")}
            >
              <span className={isAgendaOrPrescription ? "material-symbols-outlined text-xl" : "material-symbols-outlined"}>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {isAgendaOrPrescription ? (
        <div className="px-4 mt-auto">
          <Link
            href="/agenda"
            className="w-full bg-gradient-to-r from-primary to-primary-container text-white rounded-xl py-3.5 flex items-center justify-center gap-2 font-semibold shadow-md hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">add</span>
            <span>Nouveau Patient</span>
          </Link>
        </div>
      ) : null}
    </aside>
  );
}
