"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson } from "@/lib/api";
import { usePatient } from "@/contexts/PatientContext";
import { PriseEnChargeBadge } from "@/components/patient/PriseEnChargeBadge";

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

/** Traduit la priorité brute en badge d'urgence — mêmes règles/couleurs que le Fil de prescription. */
function getUrgenceBadge(priorite?: string | null): { label: string; icon: string; className: string } {
  const p = priorite?.trim().toUpperCase();
  if (p === "STAT" || p === "URGENCE VITALE") {
    return { label: "TRES URGENT", icon: "warning", className: "bg-red-600 text-white animate-pulse" };
  }
  if (p === "URGENT" || p === "URGENCE") {
    return { label: "Urgent", icon: "priority_high", className: "bg-[#EA580C] text-white" };
  }
  return { label: "Normale", icon: "check_circle", className: "bg-success-container text-success" };
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
  const [examensGroupe, setExamensGroupe] = useState<string[]>([]);

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

  // Prescription multi-examens (même prescriptionExternalId) : liste tous les examens
  // demandés dans cette même prescription, pas seulement celui de cette ligne.
  useEffect(() => {
    if (!prescription?.prescriptionExternalId) {
      setExamensGroupe(prescription?.typeExamen ? [prescription.typeExamen] : []);
      return;
    }
    let cancelled = false;
    apiJson<any[]>("/api/prescriptions")
      .then((all) => {
        if (cancelled) return;
        const exams = (Array.isArray(all) ? all : [])
          .filter((p) => p.prescriptionExternalId === prescription.prescriptionExternalId)
          .map((p) => p.typeExamen)
          .filter(Boolean);
        setExamensGroupe(exams.length ? exams : [prescription.typeExamen]);
      })
      .catch((e) => {
        console.error("Erreur chargement des examens groupés :", e);
        setExamensGroupe([prescription.typeExamen]);
      });
    return () => {
      cancelled = true;
    };
  }, [prescription?.prescriptionExternalId, prescription?.typeExamen]);

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
  const urgenceBadge = getUrgenceBadge(prescription.priorite);
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
            <PriseEnChargeBadge priseEnChargeId={patient?.priseEnChargeId} className="mt-1" />
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
        <div className="flex items-center gap-3 shrink-0">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${urgenceBadge.className}`}>
            <span className="material-symbols-outlined text-sm">{urgenceBadge.icon}</span>
            {urgenceBadge.label}
          </span>
        </div>
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
              {examensGroupe.length > 1 ? (
                <ul className="space-y-1">
                  {examensGroupe.map((exam, i) => (
                    <li key={i} className="font-bold text-lg text-primary">
                      • {exam}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-bold text-lg text-primary">{prescription.typeExamen}</p>
              )}
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
    </>
  );
}
