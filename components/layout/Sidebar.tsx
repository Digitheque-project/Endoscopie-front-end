"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

/** Bouton "Changer de service" + son menu déroulant (ouvert vers le haut, en bas du menu). */
function ServiceSwitcher() {
  const { otherServices, accessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!otherServices || otherServices.length === 0) return null;

  const handleSwitchService = (baseUrl: string) => {
    const separator = baseUrl.includes("?") ? "&" : "?";
    window.location.href = `${baseUrl}${separator}accessToken=${accessToken}`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-3 rounded-lg transition-all font-inter text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
      >
        <span className="material-symbols-outlined">switch_account</span>
        <span>Changer de service</span>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-800">Changer de service</p>
            <p className="text-[11px] text-slate-500">Accès rapide aux autres services disponibles pour votre compte</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {otherServices.map((s) => (
              <button
                key={s.serviceId}
                type="button"
                onClick={() => handleSwitchService(s.baseUrl)}
                className="w-full px-4 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 text-left flex items-center gap-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-[18px]">business_center</span>
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{s.serviceName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{s.roleName}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Bas du menu : changer de service (si applicable) au-dessus de la déconnexion. */
function SidebarFooter({ onLinkClick }: { onLinkClick?: () => void }) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    onLinkClick?.();
    logout();
    router.push("/connexion");
  };

  return (
    <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
      <ServiceSwitcher />
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-3 p-3 rounded-lg transition-all font-inter text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
      >
        <span className="material-symbols-outlined">logout</span>
        <span>Déconnexion</span>
      </button>
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
        <nav className="flex-1 space-y-1 overflow-y-auto">{navLinks()}</nav>
        <SidebarFooter />
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
          <SidebarFooter onLinkClick={onClose} />
        </aside>
      </div>
    </>
  );
}
