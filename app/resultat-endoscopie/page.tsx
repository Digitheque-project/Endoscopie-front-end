"use client";

import React, { useState, use, Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import ResultHeader from "@/components/resultat/ResultHeader";
import MedicalReport from "@/components/resultat/MedicalReport";
import DiagnosisSection from "@/components/resultat/DiagnosisSection";
import ImageUploader from "@/components/resultat/ImageUploader";
import DecisionPanel from "@/components/resultat/DecisionPanel";
import SignatureBlock from "@/components/resultat/SignatureBlock";
import { useRouter } from "next/navigation";

function ResultatContent({ searchParams }: { searchParams: Promise<any> }) {
  const resolvedParams = use(searchParams);
  const router = useRouter();

  // Extract from query params or use defaults for demo
  const patientName = resolvedParams?.patient ?? "LEFEBVRE, Sophie";
  const patientId = resolvedParams?.patientId ?? "#END-2023-9942";
  const patientAge = parseInt(resolvedParams?.age ?? "54", 10);

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

  const handleValidateResult = async () => {
    setIsSubmitting(true);

    try {
      // Simulate API validation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, send data to API
      console.log("Submitting endoscopy results...", {
        patientId,
        reportText,
        mainDiagnosis,
        observations,
        conclusion,
        complication,
        biopsy,
        followUp,
        doctorName
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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="pt-8 pb-16 px-4 flex justify-center">
        <div className="max-w-[1000px] w-full">
          
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
    </div>
  );
}

export default function ResultatEndoscopiePage(props: { searchParams: Promise<any> }) {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest">Chargement des résultats...</div>}>
        <ResultatContent {...props} />
      </Suspense>
    </AppShell>
  );
}
