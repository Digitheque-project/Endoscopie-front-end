"use client";

import Link from "next/link";
import { useAuth, AppRole } from "@/contexts/AuthContext";

const ROLE_LABELS: Record<AppRole, string> = {
  MAJOR: "Major",
  MEDECIN: "Médecin",
};

export function RequireRole({
  role,
  children,
}: {
  role: AppRole;
  children: React.ReactNode;
}) {
  const { role: currentRole } = useAuth();

  if (currentRole !== role) {
    return (
      <div className="bg-white p-10 rounded-2xl border border-outline-variant/20 shadow-sm text-center space-y-4">
        <span className="material-symbols-outlined text-4xl text-error">block</span>
        <h3 className="text-xl font-bold text-on-surface">
          Accès réservé au rôle {ROLE_LABELS[role]}
        </h3>
        <p className="text-sm text-on-surface-variant">
          Rôle actuel : {currentRole ? ROLE_LABELS[currentRole] : "aucun"}.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 transition-all"
        >
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
