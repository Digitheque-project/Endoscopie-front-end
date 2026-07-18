"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson } from "@/lib/api";
import { usePatient } from "@/contexts/PatientContext";

interface PatientDossierContentProps {
  prescriptionId: string;
}

/** Traduit le statut brut du dossier CPA en libellé + couleur clairs pour le personnel Endoscopie. */
function cpaStatutDisplay(statut?: string | null): { label: string; className: string } {
  switch (statut) {
    case "CPA Favorable":
      return { label: "CPA OK — Favorable", className: "text-success" };
    case "CPA Défavorable":
      return { label: "CPA refusée", className: "text-error" };
    case "CPA Reportée":
      return { label: "CPA en attente — Reportée", className: "text-amber-600" };
    case "CPA demandée":
      return { label: "CPA en attente du bloc", className: "text-amber-600" };
    case "Brouillon":
    case undefined:
    case null:
      return { label: "Non demandé", className: "text-on-surface-variant" };
    default:
      return { label: statut, className: "text-on-surface" };
  }
}

/** Traduit la décision brute du bloc (APTE/INAPTE/REPORT) en libellé lisible. */
function decisionCpaDisplay(decision?: string | null): { label: string; className: string } {
  switch (decision) {
    case "APTE":
      return { label: "Apte — Favorable", className: "text-success" };
    case "INAPTE":
      return { label: "Inapte — Refusée", className: "text-error" };
    case "REPORT":
      return { label: "Reportée", className: "text-amber-600" };
    default:
      return { label: decision || "", className: "text-on-surface" };
  }
}

function computeAge(dateNaissance?: string | null): number | null {
  if (!dateNaissance) return null;
  const birth = new Date(dateNaissance);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

export function PatientDossierContent({ prescriptionId }: PatientDossierContentProps) {
  const router = useRouter();
  const { setPatientData } = usePatient();
  const [prescription, setPrescription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPatientDossier, setShowPatientDossier] = useState(false);
  const [patientHistory, setPatientHistory] = useState<any[] | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [traceability, setTraceability] = useState<{
    available: boolean;
    suivis: any[];
    diagnostics: any[];
  } | null>(null);
  const [isTraceabilityLoading, setIsTraceabilityLoading] = useState(false);

  const openPatientDossier = async () => {
    setShowPatientDossier(true);
    if (patientHistory === null && !isHistoryLoading) {
      setIsHistoryLoading(true);
      apiJson<any[]>("/api/prescriptions")
        .then((all) => {
          const mine = (Array.isArray(all) ? all : [])
            .filter((p) => p.patientId === prescription?.patientId)
            .sort((a, b) => new Date(b.dateDemande).getTime() - new Date(a.dateDemande).getTime());
          setPatientHistory(mine);
        })
        .catch((e) => {
          console.error("Erreur chargement historique patient :", e);
          setPatientHistory([]);
        })
        .finally(() => setIsHistoryLoading(false));
    }
    if (traceability === null && !isTraceabilityLoading && prescription?.patientId) {
      setIsTraceabilityLoading(true);
      apiJson<{ available: boolean; suivis: any[]; diagnostics: any[] }>(
        `/api/patients/${prescription.patientId}/parcours-medical`,
      )
        .then((data) => setTraceability(data))
        .catch((e) => {
          console.error("Erreur chargement parcours médical CHU :", e);
          setTraceability({ available: false, suivis: [], diagnostics: [] });
        })
        .finally(() => setIsTraceabilityLoading(false));
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiJson<any>(`/api/prescriptions/${prescriptionId}`);
        if (!cancelled) setPrescription(data);
      } catch (err) {
        if (!cancelled) setError("Impossible de charger ce dossier.");
        console.error("Erreur chargement dossier patient :", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [prescriptionId]);

  if (isLoading) {
    return (
      <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-8 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-surface-container rounded" />
        <div className="h-4 w-72 bg-surface-container rounded" />
      </section>
    );
  }

  if (error || !prescription) {
    return (
      <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-8 text-center text-on-surface-variant">
        {error || "Dossier introuvable."}
      </section>
    );
  }

  const patient = prescription.patient;
  const age = computeAge(patient?.dateNaissance);
  const birthDate = patient?.dateNaissance
    ? new Date(patient.dateNaissance).toLocaleDateString("fr-FR")
    : null;
  const prescripteur = prescription.medecinPrescripteur
    ? `Dr. ${prescription.medecinPrescripteur.prenom} ${prescription.medecinPrescripteur.nom}`
    : "Non spécifié";
  const anesthesiste = prescription.dossierCPA?.anesthesiste
    ? `Dr. ${prescription.dossierCPA.anesthesiste.prenom} ${prescription.dossierCPA.anesthesiste.nom}`
    : null;

  const handlePlanifier = () => {
    const patientName = patient ? `${patient.nom} ${patient.prenom}` : "";
    setPatientData({
      patientId: prescription.patientId,
      prescriptionId: prescription.id,
      patientName,
      procedure: prescription.typeExamen,
      prescriber: prescripteur,
      priority: prescription.priorite,
      age: age != null ? String(age) : "",
    });

    const params = new URLSearchParams();
    params.set("prescriptionId", String(prescription.id));
    if (prescription.medecinId) params.set("medecinId", String(prescription.medecinId));
    if (prescription.patientId) params.set("patientId", String(prescription.patientId));
    if (patientName) params.set("patientName", patientName);
    if (prescription.typeExamen) params.set("procedure", String(prescription.typeExamen));
    if (prescripteur) params.set("prescriber", prescripteur);
    if (prescription.priorite) params.set("priority", String(prescription.priorite));
    params.set("from", "patient-dossier");

    router.push(`/planification-examens?${params.toString()}`);
  };

  return (
    <>
      <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-5 flex items-center justify-between gap-5">
        <div className="flex items-center gap-5 min-w-0">
          <div className="w-16 h-16 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-3xl">person</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Patient</p>
            <h2 className="font-headline text-2xl font-extrabold tracking-tight">
              {patient ? `${patient.nom} ${patient.prenom}` : "Patient inconnu"}
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              {[birthDate ? `Né(e) le ${birthDate}` : null, age != null ? `${age} ans` : null]
                .filter(Boolean)
                .join(" • ")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-secondary-container text-secondary text-xs font-bold uppercase tracking-wider">
                {prescription.typeExamen}
              </span>
              {prescription.statut === "A planifier" ? (
                <button
                  type="button"
                  onClick={handlePlanifier}
                  title="Planifier le rendez-vous de cet examen"
                  className="px-3 py-1 rounded-full bg-tertiary-fixed text-tertiary text-xs font-bold uppercase tracking-wider hover:opacity-80 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  {prescription.statut}
                </button>
              ) : (
                <span className="px-3 py-1 rounded-full bg-tertiary-fixed text-tertiary text-xs font-bold uppercase tracking-wider">
                  {prescription.statut}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={openPatientDossier}
          title="Voir le dossier patient complet"
          aria-label="Voir le dossier patient complet"
          className="flex items-center justify-center w-11 h-11 rounded-xl border border-outline-variant/20 text-primary hover:bg-primary/10 transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-2xl">folder</span>
        </button>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">DETAILS DE LA PRESCRIPTION</p>

          <div className="space-y-6 text-sm text-on-surface-variant overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            <section>
              <h4 className="font-bold text-on-surface mb-2 border-b border-outline-variant/10 pb-1">Motif de la demande</h4>
              <p>{prescription.motif || "Aucun motif renseigné."}</p>
            </section>

            <section>
              <h4 className="font-bold text-on-surface mb-2 border-b border-outline-variant/10 pb-1">Examen demandé</h4>
              <p className="font-bold text-lg text-primary">{prescription.typeExamen}</p>
            </section>

            <section>
              <h4 className="font-bold text-on-surface mb-2 border-b border-outline-variant/10 pb-1">Antécédents médicaux</h4>
              <p>{patient?.antecedentsMedicaux || "Aucun antécédent renseigné."}</p>
            </section>

            <section>
              <div>
                <h4 className="font-bold text-on-surface mb-1 border-b border-outline-variant/10 pb-1">Poids</h4>
                <p>{patient?.poids != null ? `${patient.poids} kg` : "Non renseigné"}</p>
              </div>
            </section>

            <section>
              <h4 className="font-bold text-on-surface mb-2 border-b border-outline-variant/10 pb-1">Suivi du dossier</h4>
              <ul className="space-y-1.5">
                <li className="flex items-center justify-between">
                  <span>Dossier CPA</span>
                  <span className={`font-semibold ${cpaStatutDisplay(prescription.dossierCPA?.statut).className}`}>
                    {cpaStatutDisplay(prescription.dossierCPA?.statut).label}
                  </span>
                </li>
                {prescription.dossierCPA?.dateCpa && (
                  <li className="flex items-center justify-between">
                    <span>Rendez-vous CPA donné par le Bloc</span>
                    <span className="font-semibold text-emerald-600">
                      {new Date(prescription.dossierCPA.dateCpa).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </li>
                )}
                {prescription.dossierCPA?.decisionCpa && (
                  <li className="flex items-center justify-between">
                    <span>Décision du Bloc</span>
                    <span className={`font-semibold ${decisionCpaDisplay(prescription.dossierCPA.decisionCpa).className}`}>
                      {decisionCpaDisplay(prescription.dossierCPA.decisionCpa).label}
                    </span>
                  </li>
                )}
                {prescription.dossierCPA?.dateVpa && (
                  <li className="flex items-center justify-between">
                    <span>Visite pré-anesthésique</span>
                    <span className="font-semibold text-emerald-600">
                      Réalisée le {new Date(prescription.dossierCPA.dateVpa).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </li>
                )}
                <li className="flex items-center justify-between">
                  <span>Checklist avant</span>
                  <span className={`font-semibold ${prescription.checklistAvant?.estValide ? "text-emerald-600" : "text-on-surface"}`}>
                    {prescription.checklistAvant ? (prescription.checklistAvant.estValide ? "Validée" : "En cours") : "Non démarrée"}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Checklist après</span>
                  <span className={`font-semibold ${prescription.checklistApres?.estValide ? "text-emerald-600" : "text-on-surface"}`}>
                    {prescription.checklistApres ? (prescription.checklistApres.estValide ? "Validée" : "En cours") : "Non démarrée"}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Résultat d&apos;examen</span>
                  <span className={`font-semibold ${prescription.resultatEndoscopie ? "text-emerald-600" : "text-on-surface"}`}>
                    {prescription.resultatEndoscopie ? "Disponible" : "En attente"}
                  </span>
                </li>
                {prescription.rendezVous && (
                  <>
                    <li className="flex items-center justify-between">
                      <span>Rendez-vous</span>
                      <span className="font-semibold text-on-surface">
                        {new Date(prescription.rendezVous.dateHeureDebut).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Anesthésie</span>
                      <span className={`font-semibold ${prescription.rendezVous.typeAnesthesie ? "text-emerald-600" : "text-on-surface"}`}>
                        {prescription.rendezVous.typeAnesthesie || "En attente de décision"}
                      </span>
                    </li>
                  </>
                )}
              </ul>
            </section>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Équipe</p>
          <p className="text-lg font-bold">{prescripteur}</p>
          <p className="text-sm text-on-surface-variant">Médecin prescripteur</p>
          {anesthesiste && (
            <>
              <p className="text-lg font-bold mt-3">{anesthesiste}</p>
              <p className="text-sm text-on-surface-variant">Anesthésiste référent</p>
            </>
          )}
        </div>
      </section>

      {showPatientDossier && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowPatientDossier(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl">folder</span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Dossier patient</p>
                  <h3 className="font-headline text-lg font-extrabold tracking-tight">
                    {patient ? `${patient.nom} ${patient.prenom}` : "Patient inconnu"}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPatientDossier(false)}
                aria-label="Fermer"
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Identité (service Accueil)</p>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center justify-between gap-4">
                  <span className="text-on-surface-variant">Identifiant</span>
                  <span className="font-semibold text-on-surface">{patient?.id || "Non renseigné"}</span>
                </li>
                <li className="flex items-center justify-between gap-4">
                  <span className="text-on-surface-variant">Date de naissance</span>
                  <span className="font-semibold text-on-surface">
                    {birthDate ? `${birthDate}${age != null ? ` (${age} ans)` : ""}` : "Non renseignée"}
                  </span>
                </li>
                <li className="flex items-center justify-between gap-4">
                  <span className="text-on-surface-variant">Sexe</span>
                  <span className="font-semibold text-on-surface">
                    {patient?.sexe === "F" ? "Féminin" : patient?.sexe === "M" ? "Masculin" : "Non renseigné"}
                  </span>
                </li>
                <li className="flex items-center justify-between gap-4">
                  <span className="text-on-surface-variant">CIN</span>
                  <span className="font-semibold text-on-surface">{patient?.cin || "Non renseigné"}</span>
                </li>
                <li className="flex items-center justify-between gap-4">
                  <span className="text-on-surface-variant">Profession</span>
                  <span className="font-semibold text-on-surface">{patient?.profession || "Non renseignée"}</span>
                </li>
                <li className="flex items-center justify-between gap-4">
                  <span className="text-on-surface-variant">Adresse</span>
                  <span className="font-semibold text-on-surface text-right">{patient?.adresse || "Non renseignée"}</span>
                </li>
                <li className="flex items-center justify-between gap-4">
                  <span className="text-on-surface-variant">Téléphone</span>
                  <span className="font-semibold text-on-surface">{patient?.telephone || "Non renseigné"}</span>
                </li>
                <li className="flex items-center justify-between gap-4">
                  <span className="text-on-surface-variant">Contact d&apos;urgence</span>
                  <span className="font-semibold text-on-surface">{patient?.contactUrgence || "Non renseigné"}</span>
                </li>
              </ul>
            </section>

            <section>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Historique des examens — Endoscopie
                </p>
                {patientHistory && (
                  <span className="text-[10px] font-bold text-on-surface-variant">
                    {patientHistory.length} examen{patientHistory.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-on-surface-variant mb-3">
                Limité à l&apos;unité Endoscopie — les autres services du CHU (pharmacie, laboratoire...) ne sont
                pas encore accessibles depuis ce dossier.
              </p>

              {isHistoryLoading ? (
                <p className="text-xs text-on-surface-variant">Chargement de l&apos;historique…</p>
              ) : !patientHistory || patientHistory.length === 0 ? (
                <p className="text-xs text-on-surface-variant">Aucun autre examen enregistré pour ce patient.</p>
              ) : (
                <ul className="space-y-2">
                  {patientHistory.map((item) => (
                    <li
                      key={item.id}
                      className={`rounded-xl border p-3 ${
                        item.id === prescription.id ? "border-primary/40 bg-primary/5" : "border-outline-variant/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-on-surface truncate">{item.typeExamen}</p>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant shrink-0">
                          {new Date(item.dateDemande).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3 text-xs text-on-surface-variant">
                        <span>{item.statut}</span>
                        {item.resultatEndoscopie ? (
                          <span className="font-semibold text-success">
                            Résultat : {item.resultatEndoscopie.conclusion || item.resultatEndoscopie.mainDiagnosis || "Disponible"}
                          </span>
                        ) : (
                          <span>Résultat en attente</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Parcours médical CHU (autres services)
              </p>

              {isTraceabilityLoading ? (
                <p className="text-xs text-on-surface-variant">Chargement du parcours médical…</p>
              ) : !traceability || !traceability.available ? (
                <p className="text-[11px] text-on-surface-variant">
                  Pas encore disponible — cette fonctionnalité sera activée automatiquement dès que le
                  service Dossier Patient CHU sera prêt.
                </p>
              ) : traceability.suivis.length === 0 && traceability.diagnostics.length === 0 ? (
                <p className="text-xs text-on-surface-variant">
                  Aucun suivi ou diagnostic enregistré pour ce patient dans les autres services.
                </p>
              ) : (
                <div className="space-y-3">
                  {traceability.suivis.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                        Suivis
                      </p>
                      <ul className="space-y-1.5">
                        {traceability.suivis.map((s: any, i: number) => (
                          <li key={s.id ?? i} className="text-xs text-on-surface-variant rounded-lg border border-outline-variant/20 p-2">
                            {JSON.stringify(s)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {traceability.diagnostics.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                        Diagnostics
                      </p>
                      <ul className="space-y-1.5">
                        {traceability.diagnostics.map((d: any, i: number) => (
                          <li key={d.id ?? i} className="text-xs text-on-surface-variant rounded-lg border border-outline-variant/20 p-2">
                            {JSON.stringify(d)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
