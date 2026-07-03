"use client";

import { useState, useRef, use, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { appendFinalSegment } from "@/components/voice/formatTranscript";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { RequireRole } from "@/components/auth/RequireRole";
import VoiceRecorder from "@/components/voice/VoiceRecorder";
import TranscriptionEditor, { type SavedTranscriptionEntry } from "@/components/voice/TranscriptionEditor";
import { truncateText } from "@/components/voice/formatTranscript";
import HistoryModal from "@/components/ui/HistoryModal";
import { apiFetch, apiJson, apiUrl } from "@/lib/api";
import { usePatient } from "@/contexts/PatientContext";

function computeAge(dateNaissance?: string | null): number | null {
  if (!dateNaissance) return null;
  const birth = new Date(dateNaissance);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
}

function PrescriptionWorkflowContent() {
  const router = useRouter();
  const { patientId, prescriptionId, patientName, procedure } = usePatient();
  const [medicalNotes, setMedicalNotes] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [savedMedicalNotes, setSavedMedicalNotes] = useState<SavedTranscriptionEntry[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<any>(null);
  const [contextOpen, setContextOpen] = useState(true);
  const lastSavedTranscriptionRef = useRef("");
  const controlsRef = useRef<{ start: () => void; stop: () => void; restart: () => void; pause: () => void; resume: () => void } | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!prescriptionId) return;
      try {
        const [opData, presData] = await Promise.all([
          apiJson<any>(`/api/operations/${prescriptionId}`).catch(() => null),
          apiJson<any>(`/api/prescriptions/${prescriptionId}`).catch(() => null),
        ]);
        if (opData) {
          if (opData.observationNotes) setTranscriptText(opData.observationNotes);
          setMedicalNotes(opData.medicalNotes || "");
          setSavedMedicalNotes(opData.voiceTranscripts || []);
        }
        if (presData) {
          setPrescriptionData(presData);
        }
      } catch (err) {
        console.error("Erreur chargement operation:", err);
      }
    }
    loadData();
  }, [prescriptionId]);

  const saveOperation = async () => {
    if (!prescriptionId || !patientId) return;
    const payload = {
      prescriptionId,
      patientId,
      observationNotes: transcriptText || null,
      medicalNotes,
      voiceTranscripts: savedMedicalNotes
    };
    try {
      await apiFetch('/api/operations', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
    }
  };

  // Auto-save : enregistre les notes si l'utilisateur quitte la page sans cliquer
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!prescriptionId || !patientId) return;
      const payload = JSON.stringify({ prescriptionId, patientId, observationNotes: transcriptText || null, medicalNotes, voiceTranscripts: savedMedicalNotes });
      navigator.sendBeacon('/api/operations', new Blob([payload], { type: 'application/json' }));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [prescriptionId, patientId, medicalNotes, savedMedicalNotes]);

  const handleFinalTranscript = (text: string, meta?: { startsAfterPause?: boolean }) => {
    const normalized = text.trim();
    if (!normalized) return;

    setTranscriptText((cur) => appendFinalSegment(cur, normalized, Boolean(meta?.startsAfterPause)));
  };

  const handleAudioReady = (_blob: Blob) => {
    // audio blob ready for upload if needed
  };

  const handleSaveEditor = () => {
    const normalizedTranscript = transcriptText.trim();
    if (!normalizedTranscript) return;
    setMedicalNotes((cur) => (cur && cur.trim().length > 0 ? `${cur}\n\n${normalizedTranscript}` : normalizedTranscript));
  };

  const handleSaveTranscription = (text: string) => {
    const normalized = text.trim();
    if (!normalized) return;

    if (lastSavedTranscriptionRef.current === normalized) {
      return;
    }

    const newEntry: SavedTranscriptionEntry = {
      id: Date.now().toString(),
      content: normalized,
      timestamp: new Date().toLocaleString("fr-FR"),
    };

    setSavedMedicalNotes((prev) => [newEntry, ...prev]);
    lastSavedTranscriptionRef.current = normalized;
  };

  const handleDeleteSavedTranscription = (id: string) => {
    setSavedMedicalNotes((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleClearEditor = () => {
    setTranscriptText("");
  };

  
  const handleNotesFinalTranscript = (text: string, meta?: { startsAfterPause?: boolean }) => {
    const normalized = text.trim();
    if (!normalized) return;

    setMedicalNotes((cur) => {
      const out = appendFinalSegment(cur, normalized, Boolean(meta?.startsAfterPause));
      return out;
    });
  };

  const handleCancelEdit = () => {
    setTranscriptText("");
  };

  const setControls = (c: { start: () => void; stop: () => void; restart: () => void; pause: () => void; resume: () => void } | null) => {
    controlsRef.current = c;
  };

  const latestSavedNote = savedMedicalNotes[0];
  const latestHistories = savedMedicalNotes.slice(0, 2);

  return (
    <AppShell>
      <RequireRole role="MEDECIN">
      <div className={PAGE_CONTENT_CLASS}>
        <div className="space-y-5">
          <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-sky-700 px-6 py-6 text-white lg:px-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
                    <span className="material-symbols-outlined text-[18px]">clinical_notes</span>
                    Opération Endoscopie
                  </div>
                  <div className="space-y-2">
                    <p className="max-w-2xl text-sm leading-6 text-blue-50/90 lg:text-base">
                      Étape intermédiaire du parcours clinique avec transcription vocale, prescriptions et suivi médical.
                    </p>
                  </div>
                </div>


              </div>
            </div>
          </section>

          {/* Contexte opératoire — affiché automatiquement depuis la prescription */}
          {prescriptionData && (() => {
            const pt = prescriptionData.patient;
            const ca = prescriptionData.checklistAvant;
            const rdv = prescriptionData.rendezVous;
            const age = computeAge(pt?.dateNaissance);
            return (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setContextOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-blue-100/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">info</span>
                    <span className="font-bold text-sm text-primary">Contexte de l'opération</span>
                    {pt && <span className="text-xs text-blue-600 font-semibold">— {pt.nom} {pt.prenom}{age != null ? `, ${age} ans` : ""}</span>}
                    {rdv?.typeAnesthesie && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                        Anesthésie {rdv.typeAnesthesie}
                      </span>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-blue-400">{contextOpen ? "expand_less" : "expand_more"}</span>
                </button>

                {contextOpen && (
                  <div className="px-5 pb-5 grid grid-cols-1 lg:grid-cols-3 gap-4 border-t border-blue-100">
                    {/* Colonne 1 : Patient */}
                    <div className="pt-4 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Patient</p>
                      {pt ? (
                        <div className="space-y-1 text-sm text-slate-700">
                          <p className="font-semibold text-slate-900">{pt.nom} {pt.prenom}</p>
                          {age != null && <p>{age} ans · {pt.sexe === "M" ? "Homme" : pt.sexe === "F" ? "Femme" : "—"}</p>}
                          {pt.groupeSanguin && <p>Groupe : <span className="font-semibold">{pt.groupeSanguin}</span></p>}
                          {pt.poids && <p>Poids : <span className="font-semibold">{pt.poids} kg</span></p>}
                          {pt.antecedentsMedicaux && (
                            <div className="mt-1 rounded-lg bg-white border border-blue-100 px-3 py-2 text-xs text-slate-600">
                              <span className="font-semibold text-slate-700">Antécédents : </span>{pt.antecedentsMedicaux}
                            </div>
                          )}
                        </div>
                      ) : <p className="text-sm text-slate-400">—</p>}
                    </div>

                    {/* Colonne 2 : Examen & RDV */}
                    <div className="pt-4 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Examen & Rendez-vous</p>
                      <div className="space-y-1 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">{prescriptionData.typeExamen}</p>
                        {prescriptionData.motif && <p className="text-xs text-slate-500">{prescriptionData.motif}</p>}
                        {rdv?.dateHeureDebut && (
                          <p className="mt-1">
                            <span className="material-symbols-outlined text-[14px] align-middle text-blue-400 mr-1">schedule</span>
                            {new Date(rdv.dateHeureDebut).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}
                          </p>
                        )}
                        {rdv?.salle && <p><span className="font-semibold">Salle :</span> {rdv.salle.nom}</p>}
                        {rdv?.typeAnesthesie && (
                          <p className="mt-1"><span className="font-semibold">Anesthésie :</span> {rdv.typeAnesthesie}</p>
                        )}
                        {prescriptionData.medecinPrescripteur && (
                          <p className="text-xs text-slate-500 mt-1">
                            Prescrit par Dr. {prescriptionData.medecinPrescripteur.prenom} {prescriptionData.medecinPrescripteur.nom}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Colonne 3 : Checklist avant */}
                    <div className="pt-4 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Checklist avant</p>
                      {ca ? (
                        <div className="space-y-1 text-xs text-slate-700">
                          {[
                            { k: "identiteVerifiee", l: "Identité vérifiée" },
                            { k: "jeuneRespecte", l: "Jeûne respecté" },
                            { k: "anticoagulantsArretes", l: "Anticoagulants arrêtés" },
                            { k: "antibioprophylaxie", l: "Antibioprophylaxie" },
                            { k: "risquesVerifies", l: "Risques vérifiés" },
                          ].map(({ k, l }) => (
                            <div key={k} className="flex items-center gap-1.5">
                              <span className={`material-symbols-outlined text-[14px] ${(ca as any)[k] ? "text-emerald-500" : "text-slate-300"}`}>
                                {(ca as any)[k] ? "check_circle" : "cancel"}
                              </span>
                              <span className={(ca as any)[k] ? "text-slate-700" : "text-slate-400"}>{l}</span>
                            </div>
                          ))}
                          {(ca.constantes_pouls || ca.constantes_saturation || ca.constantes_tension) && (
                            <div className="mt-2 rounded-lg bg-white border border-blue-100 px-3 py-2 space-y-0.5">
                              {ca.constantes_pouls && <p>Pouls : <span className="font-semibold">{ca.constantes_pouls}</span></p>}
                              {ca.constantes_saturation && <p>SpO2 : <span className="font-semibold">{ca.constantes_saturation}</span></p>}
                              {ca.constantes_tension && <p>Tension : <span className="font-semibold">{ca.constantes_tension}</span></p>}
                            </div>
                          )}
                          {ca.observations && (
                            <p className="mt-1 italic text-slate-500">{ca.observations}</p>
                          )}
                          <div className="mt-2">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${ca.estValide ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                              {ca.estValide ? "✓ Validée" : "En cours"}
                            </span>
                          </div>
                        </div>
                      ) : <p className="text-sm text-slate-400">Checklist non renseignée</p>}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <section className="space-y-5">
            <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] lg:p-6">
              <div className="mb-6">
                <VoiceRecorder hideTextArea statusIdleText="Observation durant l'examen" onFinalTranscript={handleFinalTranscript} onAudio={handleAudioReady} exposeControls={setControls} />
              </div>

              <textarea
                className="min-h-56 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder=""
                rows={8}
                onChange={(event) => setTranscriptText(event.target.value)}
                value={transcriptText}
              />

              <div className="mt-4 flex flex-wrap gap-2 items-center justify-end border-t border-slate-100 pt-4">
                <button onClick={handleClearEditor} type="button" className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 transition-colors">Effacer la transcription</button>
                <button onClick={() => handleSaveTranscription(transcriptText)} type="button" className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors">Enregistrer la transcription</button>
                <button onClick={handleSaveEditor} type="button" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">Ajouter aux notes complémentaires</button>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] lg:p-6">
            <div className="mb-6">
              <VoiceRecorder hideTextArea statusIdleText="Notes complémentaires" onFinalTranscript={handleNotesFinalTranscript} />
            </div>

            <textarea
              className="min-h-56 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder=""
              rows={8}
              onChange={(event) => setMedicalNotes(event.target.value)}
              value={medicalNotes}
            />
          </section>
        </div>
      </div>

      <footer className="fixed bottom-0 right-0 w-full lg:w-[calc(100%-16rem)] bg-white border-t border-slate-200 p-4 shadow-xl z-50">
        <div className="max-w-[896px] mx-auto flex items-center justify-end">

          <button
            onClick={async () => {
              await saveOperation();
              router.push('/checklists/avant');
            }}
            className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 hover:bg-slate-50 mr-4"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Retour Check-list Avant
          </button>
          <button
            onClick={async () => {
              await saveOperation();
              router.push('/checklists/apres');
            }}
            className="px-8 py-3 bg-gradient-to-r from-[#00478D] to-[#005EB8] text-white rounded-xl shadow-lg shadow-blue-900/20 font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 hover:opacity-90"
          >
            Passer Check-list Après
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      </footer>
      </RequireRole>
    </AppShell>
  );
}

export default function PrescriptionWorkflowPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <PrescriptionWorkflowContent />
    </Suspense>
  );
}
