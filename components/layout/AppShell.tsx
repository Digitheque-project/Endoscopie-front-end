"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";

type AppShellProps = {
  children: ReactNode;
};

/** Conteneur standard des pages (même padding que le tableau de bord). */
export const PAGE_CONTENT_CLASS =
  "pt-4 px-4 lg:px-8 max-w-7xl mx-auto space-y-8 pb-32";

export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <TopHeader onMenuClick={() => setMobileMenuOpen(true)} />
      <main className="lg:ml-64 lg:pt-16 min-h-screen overflow-y-auto no-scrollbar">
        {children}
      </main>
    </div>
  );
}
