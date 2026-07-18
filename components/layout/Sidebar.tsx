"use client";

import Image from "next/image";
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
    <aside className="hidden lg:flex fixed left-0 top-0 z-50 w-64 h-screen bg-[#062B47] p-4 flex-col border-r border-white/10">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-11 h-11 bg-white rounded-lg flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
          <Image
            src="/assets/chu-logo.jpeg"
            alt="Logo CHU Andrainjato"
            width={44}
            height={44}
            className="object-contain w-9 h-9"
          />
        </div>
        <div className="min-w-0">
          <h1 className="font-manrope font-extrabold text-white leading-tight text-sm truncate">
            Unite Endoscopie
          </h1>
          <p className="text-[10px] uppercase tracking-wider text-white/60 font-bold truncate">
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
                : "text-slate-300 hover:bg-white/10 hover:text-white",
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
