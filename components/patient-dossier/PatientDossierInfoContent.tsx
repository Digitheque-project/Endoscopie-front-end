"use client";

import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";

interface PatientDossierInfoContentProps {
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

export function PatientDossierInfoContent({ prescriptionId }: PatientDossierInfoContentProps) {
  const [prescription, setPrescription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientHistory, setPatientHistory] = useState<any[] | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [traceability, setTraceability] = useState<{
    available: boolean;
    suivis: any[];
    diagnostics: any[];
  } | null>(null);
  const [isTraceabilityLoading, setIsTraceabilityLoading] = useState(false);
  const [examensComplementaires, setExamensComplementaires] = useState("");
  const [isSavingExamens, setIsSavingExamens] = useState(false);
  const [saveExamensStatus, setSaveExamensStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiJson<any>(`/api/prescriptions/${prescriptionId}`);
        if (!cancelled) {
          setPrescription(data);
          setExamensComplementaires(data?.examensComplementaires || "");
        }
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

  useEffect(() => {
    if (!prescription?.patientId) return;
    setIsHistoryLoading(true);
    apiJson<any[]>("/api/prescriptions")
      .then((all) => {
        const mine = (Array.isArray(all) ? all : [])
          .filter((p) => p.patientId === prescription.patientId)
          .sort((a, b) => new Date(b.dateDemande).getTime() - new Date(a.dateDemande).getTime());
        setPatientHistory(mine);
      })
      .catch((e) => {
        console.error("Erreur chargement historique patient :", e);
        setPatientHistory([]);
      })
      .finally(() => setIsHistoryLoading(false));

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
  }, [prescription?.patientId]);

  const handleSaveExamensComplementaires = async () => {
    if (!prescription?.id) return;
    setIsSavingExamens(true);
    setSaveExamensStatus("idle");
    try {
      await apiJson(`/api/prescriptions/${prescription.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examensComplementaires }),
      });
      setPrescription((prev: any) => (prev ? { ...prev, examensComplementaires } : prev));
      setSaveExamensStatus("success");
      setTimeout(() => setSaveExamensStatus("idle"), 2500);
    } catch (e) {
      console.error("Erreur enregistrement examens complémentaires :", e);
      setSaveExamensStatus("error");
    } finally {
      setIsSavingExamens(false);
    }
  };

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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined text-2xl">contact_page</span>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Dossier patient</p>
          <h1 className="font-headline text-xl font-extrabold tracking-tight">
            {patient ? `${patient.nom} ${patient.prenom}` : "Patient inconnu"}
          </h1>
        </div>
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
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
          Examens complémentaires à prévoir avant l&apos;endoscopie
        </p>
        <textarea
          value={examensComplementaires}
          onChange={(e) => setExamensComplementaires(e.target.value)}
          placeholder="Ex. Bilan de coagulation, ECG, consultation cardiologique..."
          rows={3}
          className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none resize-none"
        />
        <div className="flex items-center justify-end gap-3 mt-2">
          {saveExamensStatus === "success" && (
            <span className="text-[11px] font-semibold text-success">Enregistré</span>
          )}
          {saveExamensStatus === "error" && (
            <span className="text-[11px] font-semibold text-error">Échec de l&apos;enregistrement</span>
          )}
          <button
            type="button"
            onClick={handleSaveExamensComplementaires}
            disabled={isSavingExamens}
            className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingExamens ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
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
  );
}
