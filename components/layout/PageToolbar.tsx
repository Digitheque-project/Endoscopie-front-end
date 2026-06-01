import { ReactNode } from "react";

type PageToolbarProps = {
  /** Sous-titre ou métadonnées (le titre principal est dans TopHeader). */
  children?: ReactNode;
  /** Boutons et contrôles à droite. */
  actions?: ReactNode;
  className?: string;
};

/** Barre secondaire sous TopHeader — alignée sur le tableau de bord. */
export function PageToolbar({ children, actions, className = "" }: PageToolbarProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 ${className}`}
    >
      {children ? <div className="min-w-0">{children}</div> : null}
      {actions ? (
        <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>
      ) : null}
    </div>
  );
}
