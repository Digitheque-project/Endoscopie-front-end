"use client";

import { ActionsCompte } from "@/components/ActionsCompte";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { MAIN_LINKS } from "@/components/layout/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  /** Tiroir mobile ouvert (< lg) — n'affecte jamais le rendu desktop, toujours visible à lg+. */
  isOpen?: boolean;
  onClose?: () => void;
}

/** Numéros de flotte du personnel (comme l'Anapath) — liste à compléter. */
const CONTACTS_PERSONNEL: { id: string; nom: string; fonction: string; telephone: string }[] = [];

/** « Numéro flotte personnel » : liste de contact du personnel, au-dessus de la déconnexion. */
function NumeroFlotte() {
  const [ouvert, setOuvert] = useState(false);
  return (
    <>
      <div className="bg-[#F5F8FA] rounded-[20px] p-4">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#006A8C]">Numéro flotte personnel</p>
        <p className="mt-1 text-[12px] font-bold leading-snug text-[#0F172A]">Liste de contact de personnel</p>
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#006A8C] px-3 py-2 text-[12px] font-bold text-white transition-colors hover:bg-[#005a76]"
        >
          <span className="material-symbols-outlined text-sm">groups</span>
          voir
        </button>
      </div>
      {ouvert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => setOuvert(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#F1F5F9] px-5 py-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
                <span className="material-symbols-outlined text-[#006A8C]">contacts</span>
                Liste de contact de personnel
              </h3>
              <button type="button" onClick={() => setOuvert(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Fermer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {CONTACTS_PERSONNEL.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">Aucun numéro flotte disponible pour le moment.</p>
              ) : (
                <ul className="space-y-2">
                  {CONTACTS_PERSONNEL.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8F9FB] p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{c.nom}</p>
                        <p className="truncate text-xs text-slate-500">{c.fonction}</p>
                      </div>
                      <a href={`tel:${c.telephone}`} className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20">
                        <span className="material-symbols-outlined text-sm">call</span>
                        {c.telephone}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Bas du menu : numéro flotte, paramètres, notifications / changer de service, déconnexion. */
function SidebarFooter({ onLinkClick }: { onLinkClick?: () => void }) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    onLinkClick?.();
    logout();
    router.push("/connexion");
  };

  return (
    <div className="px-4 sm:px-5 pb-5 space-y-4">
      <NumeroFlotte />
      <div className="space-y-1 pt-1">
        <button
          type="button"
          className="flex w-full items-center gap-3 px-4 py-2.5 rounded-[12px] text-[#64748B] hover:bg-gray-50 hover:text-[#0F172A] transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span className="text-[13px] font-bold">Paramètres</span>
        </button>
        <ActionsCompte
          className="flex w-full items-center gap-3 px-4 py-2.5 rounded-[12px] text-[#64748B] transition-colors hover:bg-gray-50 hover:text-[#0F172A]"
          classeLibelle="text-[13px] font-bold"
        />
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-2.5 rounded-[12px] text-[#E11D48] hover:bg-rose-50 hover:text-red-700 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="text-[13px] font-bold">Déconnexion</span>
        </button>
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
    visibleLinks.map((link) => {
      const active = isActive(link.href, link.matchPrefix);
      return (
        <Link
          key={link.href}
          href={link.href}
          onClick={onLinkClick}
          className={[
            "flex items-center gap-3 sm:gap-4 px-4 py-3 rounded-[12px] transition-colors duration-200",
            active
              ? "bg-[#F0F7FF] text-[#006A8C] font-bold"
              : "text-[#475569] hover:bg-gray-50 font-medium",
          ].join(" ")}
        >
          <span className={`material-symbols-outlined text-[20px] shrink-0 ${active ? "text-[#006A8C]" : "text-[#64748B]"}`}>
            {link.icon}
          </span>
          <span className="text-[13px] sm:text-[14px]">{link.label}</span>
        </Link>
      );
    });

  return (
    <>
      {/* Bureau : barre blanche sous l'en-tête, toujours visible à lg+ */}
      <aside className="hidden lg:flex sticky top-16 z-30 h-[calc(100vh-4rem)] w-[260px] shrink-0 flex-col bg-white border-r border-[#F1F5F9] rounded-tr-[24px] mt-2 shadow-[1px_0px_5px_rgba(0,0,0,0.01)] overflow-y-auto">
        <nav className="flex-1 px-4 py-5 space-y-1.5">{navLinks()}</nav>
        <SidebarFooter />
      </aside>

      {/* Mobile : tiroir hors écran, sous lg uniquement */}
      <div
        className={`lg:hidden fixed inset-0 z-[60] transition-opacity duration-200 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
        <aside
          className={`absolute left-0 top-0 h-full w-[82vw] max-w-[280px] bg-white flex flex-col border-r border-[#F1F5F9] shadow-2xl overflow-y-auto transition-transform duration-200 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em]">Navigation</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer le menu"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <nav className="flex-1 px-4 py-3 space-y-1.5">{navLinks(onClose)}</nav>
          <SidebarFooter onLinkClick={onClose} />
        </aside>
      </div>
    </>
  );
}
