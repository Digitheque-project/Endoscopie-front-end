"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson } from "@/lib/api";
import { usePatient } from "@/contexts/PatientContext";
import { PriseEnChargeBadge } from "@/components/patient/PriseEnChargeBadge";

interface PatientDossierContentProps {
  prescriptionId: string;
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
  const [examensGroupe, setExamensGroupe] = useState<{ id: string; typeExamen: string; statut: string }[]>([]);

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
  // demandés dans cette même prescription, pas seulement celui de cette ligne — avec le
  // statut propre à CHAQUE examen (chacun a sa propre décision d'anesthésie/confirmation),
  // pour ne pas afficher "confirmé" pour un examen dont le médecin n'a en fait décidé que
  // pour un autre du même groupe.
  useEffect(() => {
    if (!prescription?.prescriptionExternalId) {
      setExamensGroupe(
        prescription
          ? [{ id: prescription.id, typeExamen: prescription.typeExamen, statut: prescription.statut }]
          : [],
      );
      return;
    }
    let cancelled = false;
    apiJson<any[]>("/api/prescriptions")
      .then((all) => {
        if (cancelled) return;
        const exams = (Array.isArray(all) ? all : [])
          .filter((p) => p.prescriptionExternalId === prescription.prescriptionExternalId)
          .map((p) => ({ id: p.id, typeExamen: p.typeExamen, statut: p.statut }))
          .filter((e) => !!e.typeExamen);
        setExamensGroupe(
          exams.length
            ? exams
            : [{ id: prescription.id, typeExamen: prescription.typeExamen, statut: prescription.statut }],
        );
      })
      .catch((e) => {
        console.error("Erreur chargement des examens groupés :", e);
        setExamensGroupe([{ id: prescription.id, typeExamen: prescription.typeExamen, statut: prescription.statut }]);
      });
    return () => {
      cancelled = true;
    };
  }, [prescription?.prescriptionExternalId, prescription?.typeExamen, prescription?.id, prescription?.statut]);

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
      <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
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
              <h4 className="font-bold text-on-surface mb-2 border-b border-outline-variant/10 pb-1">Renseignements cliniques</h4>
              <p>{prescription.motif || "Aucun renseignement clinique."}</p>
            </section>

            <section>
              <h4 className="font-bold text-on-surface mb-2 border-b border-outline-variant/10 pb-1">Examen demandé</h4>
              {examensGroupe.length > 1 ? (
                <ul className="space-y-2">
                  {examensGroupe.map((exam) => {
                    const confirme = exam.statut === "Confirmé";
                    return (
                      <li key={exam.id} className="flex items-center justify-between gap-3">
                        <span className="font-bold text-lg text-primary">• {exam.typeExamen}</span>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                            confirme ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {confirme ? "Confirmé" : "En attente"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="font-bold text-lg text-primary">{prescription.typeExamen}</p>
              )}
            </section>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 space-y-3 flex flex-col">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Équipe</p>
          <p className="text-lg font-bold">{prescripteur}</p>
          <p className="text-sm text-on-surface-variant">Médecin prescripteur</p>
          {anesthesiste && (
            <>
              <p className="text-lg font-bold mt-3">{anesthesiste}</p>
              <p className="text-sm text-on-surface-variant">Anesthésiste référent</p>
            </>
          )}
          <div className="flex justify-end mt-auto pt-2">
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
      </section>
    </>
  );
}
