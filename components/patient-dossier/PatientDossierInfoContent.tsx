"use client";

import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PriseEnChargeBadge } from "@/components/patient/PriseEnChargeBadge";
import { ObservationTab } from "@/components/patient-dossier/dossier-tabs/ObservationTab";
import { DiagnosticTab } from "@/components/patient-dossier/dossier-tabs/DiagnosticTab";
import { SuiviTab } from "@/components/patient-dossier/dossier-tabs/SuiviTab";
import { ParametresTab } from "@/components/patient-dossier/dossier-tabs/ParametresTab";
import { HistoriqueTab } from "@/components/patient-dossier/dossier-tabs/HistoriqueTab";
import { ResultatsParacliniquesTab } from "@/components/patient-dossier/dossier-tabs/ResultatsParacliniquesTab";

const DOSSIER_TABS = [
  { key: "observation", label: "Observation médicale", icon: "stethoscope" },
  { key: "diagnostic", label: "Diagnostic", icon: "monitor_heart" },
  { key: "suivi", label: "Suivi", icon: "timeline" },
  { key: "parametres", label: "Paramètres", icon: "speed" },
  { key: "historique", label: "Historique", icon: "history" },
  { key: "resultats", label: "Résultats paracliniques", icon: "biotech" },
] as const;
type DossierTabKey = (typeof DOSSIER_TABS)[number]["key"];

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

const ROLE_LABELS: Record<string, string> = { MAJOR: "Major", MEDECIN: "Médecin" };

export function PatientDossierInfoContent({ prescriptionId }: PatientDossierInfoContentProps) {
  const { role, medecinName } = useAuth();
  const [prescription, setPrescription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientHistory, setPatientHistory] = useState<any[] | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [activeDossierTab, setActiveDossierTab] = useState<DossierTabKey>("observation");
  const [examensComplementaires, setExamensComplementaires] = useState("");
  const [isSavingExamens, setIsSavingExamens] = useState(false);
  const [saveExamensStatus, setSaveExamensStatus] = useState<"idle" | "success" | "error">("idle");
  const [resultatsExternes, setResultatsExternes] = useState<any[] | null>(null);
  const [isResultatsExternesLoading, setIsResultatsExternesLoading] = useState(false);
  const [notes, setNotes] = useState<any[] | null>(null);
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [addNoteError, setAddNoteError] = useState<string | null>(null);

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

    setIsResultatsExternesLoading(true);
    apiJson<any[]>(`/api/resultats-externes?patientId=${encodeURIComponent(prescription.patientId)}`)
      .then((data) => setResultatsExternes(Array.isArray(data) ? data : []))
      .catch((e) => {
        console.error("Erreur chargement des résultats externes :", e);
        setResultatsExternes([]);
      })
      .finally(() => setIsResultatsExternesLoading(false));
  }, [prescription?.patientId]);

  useEffect(() => {
    if (!prescription?.id) return;
    let cancelled = false;
    setIsNotesLoading(true);
    apiJson<any[]>(`/api/notes-dossier/${prescription.id}`)
      .then((data) => {
        if (!cancelled) setNotes(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error("Erreur chargement des notes du dossier :", e);
        if (!cancelled) setNotes([]);
      })
      .finally(() => {
        if (!cancelled) setIsNotesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [prescription?.id]);

  const handleAddNote = async () => {
    if (!prescription?.id || !newNote.trim()) return;
    setIsAddingNote(true);
    setAddNoteError(null);
    const auteur = role === "MEDECIN" ? `Dr. ${medecinName}` : ROLE_LABELS[role ?? ""] || "Inconnu";
    try {
      const created = await apiJson<any>("/api/notes-dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prescriptionId: prescription.id, auteur, contenu: newNote.trim() }),
      });
      setNotes((prev) => [created, ...(prev || [])]);
      setNewNote("");
    } catch (e) {
      console.error("Erreur ajout note dossier :", e);
      setAddNoteError("Échec de l'ajout de la note.");
    } finally {
      setIsAddingNote(false);
    }
  };

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
    <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined text-2xl">contact_page</span>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Dossier patient</p>
          <h1 className="font-headline text-xl font-extrabold tracking-tight">
            {patient ? `${patient.nom} ${patient.prenom}` : "Patient inconnu"}
          </h1>
          <PriseEnChargeBadge priseEnChargeId={patient?.priseEnChargeId} className="mt-1" />
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
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
          Dossier médical CHU (autres services)
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {DOSSIER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveDossierTab(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                activeDossierTab === tab.key
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {prescription.patientId && (
          <>
            {activeDossierTab === "observation" && <ObservationTab patientId={prescription.patientId} />}
            {activeDossierTab === "diagnostic" && <DiagnosticTab patientId={prescription.patientId} />}
            {activeDossierTab === "suivi" && <SuiviTab patientId={prescription.patientId} />}
            {activeDossierTab === "parametres" && <ParametresTab patientId={prescription.patientId} />}
            {activeDossierTab === "historique" && <HistoriqueTab patientId={prescription.patientId} />}
            {activeDossierTab === "resultats" && <ResultatsParacliniquesTab patientId={prescription.patientId} />}
          </>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Résultats d&apos;examens (autres services)
          </p>
          {resultatsExternes && resultatsExternes.length > 0 && (
            <span className="text-[10px] font-bold text-on-surface-variant">
              {resultatsExternes.length} résultat{resultatsExternes.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {isResultatsExternesLoading ? (
          <p className="text-xs text-on-surface-variant">Chargement des résultats…</p>
        ) : !resultatsExternes || resultatsExternes.length === 0 ? (
          <p className="text-[11px] text-on-surface-variant">
            Aucun résultat reçu pour l&apos;instant — dès qu&apos;un autre service (laboratoire, imagerie...)
            transmet un résultat d&apos;examen pour ce patient, il apparaîtra automatiquement ici.
          </p>
        ) : (
          <ul className="space-y-2">
            {resultatsExternes.map((r) => (
              <li key={r.id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-on-surface truncate">
                    {r.typeExamen || "Résultat d'examen"}
                  </p>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 shrink-0">
                    {new Date(r.receivedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>
                <p className="mt-1 text-xs text-on-surface-variant">{r.motif}</p>
                {r.sourceService && (
                  <p className="mt-1 text-[10px] font-semibold text-emerald-700">Source : {r.sourceService}</p>
                )}
              </li>
            ))}
          </ul>
        )}
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
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
          Notes / Observations
        </p>
        <div className="flex items-start gap-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Ajouter une note ou observation sur ce patient..."
            rows={2}
            className="flex-1 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none resize-none"
          />
          <button
            type="button"
            onClick={handleAddNote}
            disabled={isAddingNote || !newNote.trim()}
            className="shrink-0 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAddingNote ? "Ajout…" : "Ajouter"}
          </button>
        </div>
        {addNoteError && <p className="text-[11px] font-semibold text-error mt-1.5">{addNoteError}</p>}

        <div className="mt-3 space-y-2">
          {isNotesLoading ? (
            <p className="text-xs text-on-surface-variant">Chargement des notes…</p>
          ) : !notes || notes.length === 0 ? (
            <p className="text-xs text-on-surface-variant">Aucune note enregistrée pour ce patient.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="rounded-xl border border-outline-variant/20 p-3">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-xs font-bold text-on-surface">{note.auteur}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant shrink-0">
                    {new Date(note.dateCreation).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{note.contenu}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
