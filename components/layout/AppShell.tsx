"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const sidebarOffset = pathname === "/agenda" || pathname === "/prescriptions" ? "lg:ml-72" : "lg:ml-64";

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar />
      <TopHeader />
      <main className={`${sidebarOffset} lg:pt-16 min-h-screen overflow-y-auto no-scrollbar`}>{children}</main>
    </div>
  );
}
