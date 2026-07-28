"use client";

import { useEffect, useState } from "react";
import { fetchPriseEnCharge, type PriseEnCharge } from "@/lib/prise-en-charge";

/**
 * Bordure gauche colorée à appliquer sur la ligne/carte contenant un patient ayant une
 * prise en charge — couleur fixe, même convention que les bandeaux de notification
 * (voir components/layout/NotificationBell.tsx).
 */
export function priseEnChargeStripeClass(hasPriseEnCharge: boolean): string {
  return hasPriseEnCharge ? "border-l-4 border-l-amber-400" : "";
}

/**
 * Affiche le nom de la prise en charge (entreprise partenaire) sous le nom du patient.
 * Récupérée en direct depuis le service CHU (voir lib/prise-en-charge.ts) à partir du
 * `priseEnChargeId` déjà présent sur la fiche patient — ne s'affiche rien tant que
 * l'appel est en cours ou si le patient n'a pas de prise en charge.
 */
export function PriseEnChargeBadge({
  priseEnChargeId,
  className = "",
}: {
  priseEnChargeId?: string | null;
  className?: string;
}) {
  const [priseEnCharge, setPriseEnCharge] = useState<PriseEnCharge | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPriseEnCharge(null);
    if (!priseEnChargeId) return;
    fetchPriseEnCharge(priseEnChargeId).then((result) => {
      if (!cancelled) setPriseEnCharge(result);
    });
    return () => {
      cancelled = true;
    };
  }, [priseEnChargeId]);

  if (!priseEnCharge) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 max-w-full truncate rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 ${className}`}
      title={priseEnCharge.nom}
    >
      <span className="material-symbols-outlined text-[12px] shrink-0">badge</span>
      <span className="truncate">{priseEnCharge.nom}</span>
    </span>
  );
}
