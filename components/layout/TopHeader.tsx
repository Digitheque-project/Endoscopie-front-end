"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_HEADER, HEADER_BY_PATH } from "@/components/layout/navigation";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { apiJson } from "@/lib/api";
import { PriseEnChargeBadge } from "@/components/patient/PriseEnChargeBadge";

const SEARCH_MIN_LENGTH = 2;
const SEARCH_MAX_RESULTS = 8;

function matchesQuery(p: any, q: string): boolean {
  const patientName = `${p.patient?.nom || ""} ${p.patient?.prenom || ""}`.toLowerCase();
  const procedure = (p.typeExamen || "").toLowerCase();
  const identifiants = `${p.id || ""} ${p.externalId || ""} ${p.patientId || ""}`.toLowerCase();
  return patientName.includes(q) || procedure.includes(q) || identifiants.includes(q);
}

function LiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;
  return (
    <span className="hidden lg:block text-xs font-mono font-semibold text-on-surface tabular-nums">
      {time}
    </span>
  );
}

const HIDE_UNIT_LABEL_PATHS = new Set(["/", "/demande-cpa"]);

const ROLE_LABELS: Record<string, string> = {
  MAJOR: "Major",
  MEDECIN: "Médecin",
};

export function TopHeader({ onMenuClick }: { onMenuClick?: () => void } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, medecinName } = useAuth();
  const header = HEADER_BY_PATH[pathname] ?? DEFAULT_HEADER;
  const hideUnitLabel =
    HIDE_UNIT_LABEL_PATHS.has(pathname) || pathname.startsWith("/patient-dossier");

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchCache, setSearchCache] = useState<any[] | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showSearchResults) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSearchResults]);

  const handleSearchChange = async (value: string) => {
    setSearchQuery(value);
    setShowSearchResults(true);
    if (value.trim().length >= SEARCH_MIN_LENGTH && searchCache === null && !isSearchLoading) {
      setIsSearchLoading(true);
      try {
        const data = await apiJson<any[]>("/api/prescriptions");
        setSearchCache(Array.isArray(data) ? data : []);
      } catch {
        setSearchCache([]);
      } finally {
        setIsSearchLoading(false);
      }
    }
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < SEARCH_MIN_LENGTH || !searchCache) return [];
    return searchCache.filter((p) => matchesQuery(p, q)).slice(0, SEARCH_MAX_RESULTS);
  }, [searchQuery, searchCache]);

  const handleSelectResult = (prescription: any) => {
    setSearchQuery("");
    setShowSearchResults(false);
    router.push(`/patient-dossier/${prescription.id}`);
  };

  return (
    <header className="sticky top-0 lg:fixed lg:left-64 right-0 z-40 h-16 px-4 lg:px-8 flex items-center justify-between border-b border-outline-variant/30 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center gap-4 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Ouvrir le menu"
          className="lg:hidden shrink-0 w-10 h-10 rounded-lg text-on-surface-variant hover:bg-slate-100 flex items-center justify-center"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white shrink-0">
          <span className="material-symbols-outlined">{header.icon}</span>
        </div>
        <div className="min-w-0">
          {!hideUnitLabel && (
            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
              Unite Endoscopie
            </p>
          )}
          <h2 className="text-lg font-semibold text-on-surface leading-tight truncate">
            {header.title}
          </h2>
          {header.subtitle ? (
            <p className="text-[10px] text-on-surface-variant truncate hidden sm:block">
              {header.subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        <div className="relative hidden xl:block w-full max-w-xl" ref={searchRef}>
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary text-2xl font-bold">
            search
          </span>
          <input
            className="w-full bg-white border-2 border-primary rounded-2xl pl-12 pr-10 py-3 text-sm transition-all hover:ring-4 hover:ring-primary/10 focus:ring-4 focus:ring-primary/20 text-on-surface placeholder:text-slate-400 font-bold shadow-md outline-none"
            placeholder="Rechercher un patient, une procédure ou un identifiant..."
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchQuery.trim().length >= SEARCH_MIN_LENGTH && setShowSearchResults(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowSearchResults(false);
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setShowSearchResults(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Effacer la recherche"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}

          {showSearchResults && searchQuery.trim().length >= SEARCH_MIN_LENGTH && (
            <div className="absolute left-0 top-full mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
              {isSearchLoading ? (
                <div className="px-4 py-6 text-center text-xs font-semibold text-slate-400">
                  Recherche en cours…
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs font-semibold text-slate-400">
                  Aucun résultat pour « {searchQuery.trim()} »
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {searchResults.map((p) => {
                    const patientName = p.patient
                      ? `${p.patient.nom || ""} ${p.patient.prenom || ""}`.trim()
                      : "Patient inconnu";
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectResult(p)}
                        className="w-full px-4 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 text-left flex items-center gap-3"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <span className="material-symbols-outlined text-[18px]">person</span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-800 truncate">{patientName}</p>
                          <p className="text-[11px] text-slate-500 truncate">{p.typeExamen || "Examen"}</p>
                          <PriseEnChargeBadge priseEnChargeId={p.patient?.priseEnChargeId} className="mt-0.5" />
                        </div>
                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold uppercase tracking-wide">
                          {p.statut || "—"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <NotificationBell />

        <LiveClock />

        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 lg:pl-4 border-l border-outline-variant/30">
          <div className="text-right hidden lg:block">
            <p className="text-xs font-bold text-on-surface">
              {role === "MEDECIN" ? `Dr. ${medecinName}` : ROLE_LABELS[role ?? ""] || "—"}
            </p>
            <p className="text-[10px] text-on-surface-variant">
              {role ? ROLE_LABELS[role] : ""}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 ring-2 ring-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">
              {role === "MEDECIN" ? "stethoscope" : "badge"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
