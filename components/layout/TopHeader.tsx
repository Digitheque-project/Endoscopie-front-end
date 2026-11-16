"use client";

import { PastilleAutresServices } from "@/components/ActionsCompte";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_HEADER, HEADER_BY_PATH } from "@/components/layout/navigation";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { apiJson } from "@/lib/api";
import { decodeJwt, type AuthServiceClaim } from "@/lib/auth";
import { PriseEnChargeBadge } from "@/components/patient/PriseEnChargeBadge";
import PointServeur from "@/components/PointServeur";

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
    <span className="hidden lg:block text-xs font-mono font-semibold text-[#475569] tabular-nums">
      {time}
    </span>
  );
}

const ROLE_LABELS: Record<string, string> = {
  MAJOR: "Major",
  MEDECIN: "Médecin",
};

type ClaimAvecLogo = AuthServiceClaim & { chu?: { id: string; name: string; logoUrl?: string } };

export function TopHeader({ onMenuClick }: { onMenuClick?: () => void } = {}) {
  const router = useRouter();
  const { role, medecinName, accessToken } = useAuth();

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

  // Logo, nom du CHU et prénom : lus dans le jeton de l'agent, jamais figés en dur.
  const jeton = useMemo(() => (accessToken ? decodeJwt(accessToken) : null), [accessToken]);
  const claimEndoscopie = jeton?.services?.find(
    (s) => s.serviceName?.trim().toLowerCase() === "endoscopie",
  ) as ClaimAvecLogo | undefined;
  const chuLogoUrl =
    (jeton as { chuLogoUrl?: string } | null)?.chuLogoUrl || claimEndoscopie?.chu?.logoUrl || "";
  const chuNom = claimEndoscopie?.chu?.name ?? "";
  const prenom = jeton?.firstname?.trim() || "";
  const nomAffiche = medecinName
    ? role === "MEDECIN"
      ? `Dr. ${medecinName}`
      : medecinName
    : ROLE_LABELS[role ?? ""] || "—";

  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-[#F1F5F9] px-4 sm:px-6 lg:px-7 flex items-center justify-between gap-4 shadow-[0px_4px_10px_rgba(0,0,0,0.015)]">
      {/* Gauche : menu mobile + logo du CHU + nom du service */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Ouvrir le menu"
          className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>
        {chuLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={chuLogoUrl}
            alt={chuNom ? `Logo ${chuNom}` : "Logo CHU"}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border border-[#CFE9EF] flex-shrink-0"
          />
        ) : null}
        <div className="text-[16px] sm:text-[18px] lg:text-[20px] font-black text-[#004A66] tracking-tight truncate">
          Endoscopie
        </div>
      </div>

      {/* Centre : salutation */}
      <div className="hidden md:block text-[13px] font-semibold text-gray-500 truncate">
        Bonjour{prenom ? ` ${prenom}` : ""}
      </div>

      {/* Droite : recherche, notifications, profil */}
      <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 min-w-0">
        <div className="relative hidden xl:block w-72" ref={searchRef}>
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-[20px]">
            search
          </span>
          <input
            className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl pl-10 pr-9 py-2 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] font-medium outline-none transition-all focus:bg-white focus:border-[#006A8C] focus:ring-2 focus:ring-[#006A8C]/20"
            placeholder="Rechercher un patient, une procédure..."
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]"
              aria-label="Effacer la recherche"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}

          {showSearchResults && searchQuery.trim().length >= SEARCH_MIN_LENGTH && (
            <div className="absolute right-0 top-full mt-2 w-[26rem] max-w-[90vw] rounded-2xl border border-[#F1F5F9] bg-white shadow-xl z-50 overflow-hidden">
              {isSearchLoading ? (
                <div className="px-4 py-6 text-center text-xs font-semibold text-[#94A3B8]">
                  Recherche en cours…
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs font-semibold text-[#94A3B8]">
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
                        className="w-full px-4 py-3 border-b border-[#F1F5F9] last:border-b-0 hover:bg-[#F8F9FB] text-left flex items-center gap-3"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0F7FF] text-[#006A8C]">
                          <span className="material-symbols-outlined text-[18px]">person</span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[#0F172A] truncate">{patientName}</p>
                          <p className="text-[11px] text-[#64748B] truncate">{p.typeExamen || "Examen"}</p>
                          <PriseEnChargeBadge priseEnChargeId={p.patient?.priseEnChargeId} className="mt-0.5" />
                        </div>
                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] text-[10px] font-bold uppercase tracking-wide">
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

        <PastilleAutresServices />
        <NotificationBell />

        <LiveClock />

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex flex-col text-right min-w-0">
            <span className="text-[12px] sm:text-[13px] font-extrabold text-gray-900 leading-tight truncate max-w-[140px] sm:max-w-[200px]">
              {nomAffiche}
            </span>
            <span className="hidden sm:block text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight mt-0.5 truncate">
              {role ? ROLE_LABELS[role] : ""}
            </span>
          </div>
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
            <div className="w-full h-full rounded-full bg-[#F0F7FF] border-2 border-[#CFE9EF] flex items-center justify-center text-[#006A8C]">
              <span className="material-symbols-outlined text-[20px]">
                {role === "MEDECIN" ? "stethoscope" : "badge"}
              </span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 leading-none">
              <PointServeur className="!mr-0" />
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

/** Titre de la page courante, en haut du contenu (sous l'en-tête commun). */
export function PageHeading() {
  const pathname = usePathname();
  const header =
    HEADER_BY_PATH[pathname] ??
    HEADER_BY_PATH[`/${pathname.split("/")[1] ?? ""}`] ??
    DEFAULT_HEADER;
  return (
    <div className="pt-6 px-4 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-[#F0F7FF] text-[#006A8C] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined">{header.icon}</span>
        </div>
        <div className="min-w-0">
          <h1 className="text-[20px] sm:text-[22px] font-extrabold text-[#0F172A] leading-tight truncate">
            {header.title}
          </h1>
          {header.subtitle ? (
            <p className="text-[12px] text-[#64748B] truncate">{header.subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
