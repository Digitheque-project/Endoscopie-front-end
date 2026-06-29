"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson } from "@/lib/api";
import { usePatient } from "@/contexts/PatientContext";

interface PatientDossierContentProps {
  prescriptionId: string;
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

  const goTo = (href: string) => {
    setPatientData({
      patientId: prescription.patientId,
      prescriptionId: prescription.id,
      patientName: patient ? `${patient.nom} ${patient.prenom}` : "",
      procedure: prescription.typeExamen,
      prescriber: prescripteur,
      priority: prescription.priorite,
      age: age != null ? String(age) : "",
    });
    router.push(href);
  };

  return (
    <>
      <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-4xl">person</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Patient</p>
            <h2 className="font-headline text-3xl font-extrabold tracking-tight">
              {patient ? `${patient.nom} ${patient.prenom}` : "Patient inconnu"}
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              {birthDate ? `Né(e) le ${birthDate} • ` : ""}
              {age != null ? `${age} ans • ` : ""}
              ID {prescription.patientId}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-secondary-container text-secondary text-xs font-bold uppercase tracking-wider">
                {prescription.typeExamen}
              </span>
              <span className="px-3 py-1 rounded-full bg-tertiary-fixed text-tertiary text-xs font-bold uppercase tracking-wider">
                {prescription.statut}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => goTo("/checklists/avant")}
            className="px-5 py-3 rounded-xl bg-primary text-white font-bold text-sm text-center hover:opacity-90 transition-opacity shadow-md hover:scale-105 active:scale-95 duration-200"
          >
            Démarrer checklist
          </button>
          <button
            type="button"
            onClick={() => goTo("/planification-examens")}
            className="px-5 py-3 rounded-xl border border-outline-variant/40 text-on-surface-variant font-bold text-sm text-center hover:bg-surface-container-low transition-all hover:scale-105 active:scale-95 duration-200"
          >
            Planifier l&apos;examen
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">DETAIL DE LA PRESCRIPTION</p>

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

            <section className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold text-on-surface mb-1 border-b border-outline-variant/10 pb-1">Groupe sanguin</h4>
                <p>{patient?.groupeSanguin || "Non renseigné"}</p>
              </div>
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
                  <span className="font-semibold text-on-surface">{prescription.dossierCPA?.statut || "Non demandé"}</span>
                </li>
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
                  <li className="flex items-center justify-between">
                    <span>Rendez-vous</span>
                    <span className="font-semibold text-on-surface">
                      {new Date(prescription.rendezVous.dateHeureDebut).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </li>
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
        <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Actions rapides</p>
          <button
            type="button"
            onClick={() => goTo("/demande-cpa")}
            className="block w-full text-left px-4 py-2 rounded-lg bg-surface-container-low text-primary font-bold text-sm hover:bg-surface-container transition-colors"
          >
            Demande CPA / image
          </button>
          <a
            href="/rapport"
            className="block px-4 py-2 rounded-lg bg-surface-container-low text-primary font-bold text-sm hover:bg-surface-container transition-colors"
          >
            Voir le rapport
          </a>
        </div>
      </section>
    </>
  );
}
