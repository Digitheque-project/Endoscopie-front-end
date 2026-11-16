"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeading, TopHeader } from "@/components/layout/TopHeader";

type AppShellProps = {
  children: ReactNode;
};

/** Conteneur standard des pages (même padding que le tableau de bord). */
export const PAGE_CONTENT_CLASS =
  "pt-4 px-4 lg:px-8 max-w-7xl mx-auto space-y-8 pb-32";

/** Cadre commun (modèle Consultation externe) : en-tête pleine largeur, puis barre latérale + contenu. */
export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FB] text-[#0F172A]">
      <TopHeader onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="flex flex-1 min-w-0">
        <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <main className="flex-1 min-w-0 overflow-x-hidden bg-[#F8F9FB]">
          <PageHeading />
          {children}
        </main>
      </div>
    </div>
  );
}
