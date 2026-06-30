"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_LINKS } from "@/components/layout/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useAuth();
  const visibleLinks = MAIN_LINKS.filter((link) => !link.roles || (role && link.roles.includes(role)));

  const isActive = (href: string, matchPrefix?: boolean) => {
    if (href === "/") {
      return pathname === "/";
    }
    return matchPrefix ? pathname.startsWith(href) : pathname === href;
  };

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 z-50 w-64 h-screen bg-slate-100/50 backdrop-blur-xl p-4 flex-col border-r border-outline-variant/20">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center text-white shrink-0">
          <span className="material-symbols-outlined">clinical_notes</span>
        </div>
        <div className="min-w-0">
          <h1 className="font-manrope font-extrabold text-blue-800 leading-tight text-sm truncate">
            Unite Endoscopie
          </h1>
          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold truncate">
            CHU Andrainjato
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {visibleLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={[
              "flex items-center gap-3 p-3 rounded-lg transition-all font-inter text-sm font-semibold",
              isActive(link.href, link.matchPrefix)
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:bg-slate-200",
            ].join(" ")}
          >
            <span className="material-symbols-outlined">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
