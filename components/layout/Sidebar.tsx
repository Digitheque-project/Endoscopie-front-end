"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_LINKS } from "@/components/layout/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  /** Tiroir mobile ouvert (< lg) — n'affecte jamais le rendu desktop, toujours visible à lg+. */
  isOpen?: boolean;
  onClose?: () => void;
}

function SidebarBrand() {
  return (
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
  );
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { role } = useAuth();
  const visibleLinks = MAIN_LINKS.filter((link) => !link.roles || (role && link.roles.includes(role)));

  const isActive = (href: string, matchPrefix?: boolean) => {
    if (href === "/") {
      return pathname === "/";
    }
    return matchPrefix ? pathname.startsWith(href) : pathname === href;
  };

  const navLinks = (onLinkClick?: () => void) =>
    visibleLinks.map((link) => (
      <Link
        key={link.href}
        href={link.href}
        onClick={onLinkClick}
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
    ));

  return (
    <>
      {/* Desktop — inchangé, toujours visible à lg+ */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-50 w-64 h-screen bg-[#062B47] p-4 flex-col border-r border-white/10">
        <SidebarBrand />
        <nav className="flex-1 space-y-1">{navLinks()}</nav>
      </aside>

      {/* Mobile — tiroir hors-écran, sous lg uniquement */}
      <div
        className={`lg:hidden fixed inset-0 z-[60] transition-opacity duration-200 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-72 max-w-[80vw] bg-[#062B47] p-4 flex flex-col border-r border-white/10 shadow-2xl transition-transform duration-200 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1 min-w-0">
              <SidebarBrand />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer le menu"
              className="shrink-0 w-9 h-9 -mt-8 rounded-lg text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto">{navLinks(onClose)}</nav>
        </aside>
      </div>
    </>
  );
}
