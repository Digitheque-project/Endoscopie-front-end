"use client";

import React, { useState, useEffect, Suspense } from "react";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import ResultHeader from "@/components/resultat/ResultHeader";
import MedicalReport from "@/components/resultat/MedicalReport";
import DiagnosisSection from "@/components/resultat/DiagnosisSection";
import ImageUploader from "@/components/resultat/ImageUploader";
import DecisionPanel from "@/components/resultat/DecisionPanel";
import SignatureBlock from "@/components/resultat/SignatureBlock";
import { useRouter } from "next/navigation";
import { apiFetch, apiUrl } from "@/lib/api";
import { usePatient } from "@/contexts/PatientContext";

function ResultatContent() {
  const router = useRouter();
  const { patientId, prescriptionId, patientName, procedure, age } = usePatient();
  const patientAge = parseInt(age || "0", 10);
  // States
  const [reportText, setReportText] = useState("");
  const [mainDiagnosis, setMainDiagnosis] = useState("");
  const [observations, setObservations] = useState("");
  const [conclusion, setConclusion] = useState("");
  
  const [complication, setComplication] = useState<string | null>(null);
  const [biopsy, setBiopsy] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState("consultation");
  
  const [doctorName, setDoctorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!prescriptionId) return;
      try {
        const resp = await fetch(apiUrl(`/api/resultats/${prescriptionId}`));
        if (resp.ok) {
          const text = await resp.text();
          if (text) {
            const data = JSON.parse(text);
            if (data) {
              setReportText(data.reportText || "");
              setMainDiagnosis(data.mainDiagnosis || "");
              setObservations(data.observations || "");
              setConclusion(data.conclusion || "");
              setComplication(data.complication || null);
              setBiopsy(data.biopsy || null);
              setFollowUp(data.followUp || "consultation");
              setDoctorName(data.doctorName || "");
            }
          }
        }
      } catch (err) {
        console.error("Erreur chargement resultat:", err);
      }
    }
    loadData();
  }, [prescriptionId]);
  const handleValidateResult = async () => {
    setIsSubmitting(true);

    try {
      if (!prescriptionId) return;

      const payload = {
        prescriptionId,
        patientId,
        reportText,
        mainDiagnosis,
        observations,
        conclusion,
        complication,
        biopsy,
        followUp,
        doctorName
      };

      await apiFetch('/api/resultats', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      setIsSuccess(true);
      
      // Delay before redirecting to show the success state
      setTimeout(() => {
        router.push("/rapport");
      }, 1500);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 font-sans pb-24">
      <div className="flex justify-center">
        <div className="max-w-[1000px] w-full p-6">
          
          <ResultHeader 
            patientName={patientName}
            patientId={patientId}
            patientAge={patientAge}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column (Main content) */}
            <div className="lg:col-span-2 space-y-6">
              <DiagnosisSection 
                mainDiagnosis={mainDiagnosis} setMainDiagnosis={setMainDiagnosis}
                observations={observations} setObservations={setObservations}
                conclusion={conclusion} setConclusion={setConclusion}
              />

              <MedicalReport 
                reportText={reportText} 
                setReportText={setReportText} 
              />
            </div>

            {/* Right Column (Sidebar content) */}
            <div className="space-y-6">
              <ImageUploader />
              
              <DecisionPanel 
                complication={complication} setComplication={setComplication}
                biopsy={biopsy} setBiopsy={setBiopsy}
                followUp={followUp} setFollowUp={setFollowUp}
              />
            </div>

          </div>

          {/* Full width bottom block */}
          <div className="mt-6">
            <SignatureBlock 
              doctorName={doctorName} 
              setDoctorName={setDoctorName} 
              onValidate={handleValidateResult} 
              isSubmitting={isSubmitting}
              isSuccess={isSuccess}
            />
          </div>
          
        </div>
      </div>

      <footer className="fixed bottom-0 right-0 w-[calc(100%-16rem)] bg-white border-t border-slate-200 p-4 shadow-xl z-50">
        <div className="max-w-[896px] mx-auto flex items-center justify-between">
          <div className="flex-1 mr-12">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">Progression</span>
              <span className="text-xs font-bold text-blue-900">75% (PHASE 3/4)</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00478D] to-[#005EB8] w-3/4 rounded-full" />
            </div>
          </div>

          <a href="/checklists/apres" className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 hover:bg-slate-50 mr-4">
            <span className="material-symbols-outlined">arrow_back</span>
            Retour Check-list Après
          </a>
          <button
            onClick={async () => {
              await handleValidateResult();
            }} 
            className="px-8 py-3 bg-gradient-to-r from-[#00478D] to-[#005EB8] text-white rounded-xl shadow-lg shadow-blue-900/20 font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 hover:opacity-90"
          >
            Valider le résultat
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default function ResultatEndoscopiePage() {
  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        <Suspense fallback={<div className="py-8 text-center text-slate-500 font-bold uppercase tracking-widest">Chargement des résultats...</div>}>
          <ResultatContent />
        </Suspense>
      </div>
    </AppShell>
  );
}
