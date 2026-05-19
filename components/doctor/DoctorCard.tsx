"use client";

interface DoctorCardProps {
  id: string;
  nom: string;
  prenom?: string;
  specialite?: string;
  service?: string;
  statut?: string;
  avatarUrl?: string | null;
}

function getStatusClasses(statut?: string) {
  const value = (statut || "Disponible").toLowerCase();

  if (value.includes("garde")) {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }

  if (value.includes("occup")) {
    return "bg-rose-100 text-rose-700 border-rose-200";
  }

  return "bg-emerald-100 text-emerald-700 border-emerald-200";
}

function getStatusLabel(statut?: string) {
  return statut || "Disponible";
}

function getInitials(nom: string, prenom?: string) {
  const parts = [prenom, nom].filter(Boolean).map((part) => part!.trim());
  if (parts.length === 0) return "DR";
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function DoctorCard({ id, nom, prenom, specialite, service, statut, avatarUrl }: DoctorCardProps) {
  const displayName = [prenom, nom].filter(Boolean).join(" ") || nom;
  const statusClasses = getStatusClasses(statut);
  const initials = getInitials(nom, prenom);

  return (
    <article className="group rounded-2xl border border-outline-variant/10 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-900/10">
      <div className="flex items-start gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-surface-container to-secondary/10 ring-1 ring-outline-variant/10">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-black text-primary">
              {initials}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold text-on-surface">{displayName}</p>
              <p className="mt-0.5 text-xs font-mono text-on-surface-variant">ID: {id}</p>
            </div>
            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${statusClasses}`}>
              {getStatusLabel(statut)}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-primary">medical_information</span>
              <span className="font-semibold text-on-surface">{specialite || "Spécialité non renseignée"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-primary">domain</span>
              <span>{service || specialite || "Service non renseigné"}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]">badge</span>
              <span>{nom}</span>
            </div>
            <button className="rounded-xl bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/10">
              Voir profil
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
