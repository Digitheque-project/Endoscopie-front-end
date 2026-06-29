"use client";

/**
 * EXEMPLE D'INTÉGRATION DANS resultat-endoscopie/page.tsx
 * 
 * Cette version adapte l'interface existante pour utiliser l'architecture configurable.
 * Elle montre comment :
 * 1. Récupérer le type d'endoscopie
 * 2. Charger la configuration appropriée
 * 3. Afficher les champs dynamiques
 * 4. Valider les données
 * 5. Soumettre les résultats
 */

import React, { useState, useEffect } from "react";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";
import { usePatient } from "@/contexts/PatientContext";

// Import des nouveaux outils de configuration
import { useEndoscopyConfig, useEndoscopyFormValidation } from "@/lib/hooks/useEndoscopyConfig";
import { EndoscopyFormSection } from "@/components/endoscopy/EndoscopyFormFields";
import { getEndoscopyConfig } from "@/lib/config/endoscopyTypes";

function ResultatContent() {
  const router = useRouter();
  const { patientId, prescriptionId, patientName, procedure, age } = usePatient();
  
  // Configuration dynamique basée sur le type d'endoscopie
  const { config, allFields, fieldsByGroup } = useEndoscopyConfig(procedure);
  const { validateForm, hasErrors } = useEndoscopyFormValidation(procedure);

  // État du formulaire
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [doctorName, setDoctorName] = useState("");

  // Charger les données existantes si disponibles
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
              // Charger les champs communs et spécifiques
              setFormData(data.commonFields || {});
              if (data.specificFields) {
                setFormData(prev => ({ ...prev, ...data.specificFields }));
              }
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

  // Gérer les changements de champ
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    // Nettoyer l'erreur de validation pour ce champ
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  // Valider et soumettre
  const handleValidateResult = async () => {
    // Valider les données
    const errors = validateForm(formData);
    
    if (hasErrors(errors)) {
      setValidationErrors(errors);
      // Scroller vers le premier champ en erreur
      const firstError = Object.keys(errors)[0];
      document.getElementById(firstError)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      if (!prescriptionId) return;

      // Séparer les champs communs et spécifiques
      const commonFields: Record<string, any> = {};
      const specificFields: Record<string, any> = {};

      const commonFieldIds = [
        'indication', 'reportText', 'observations', 'mainDiagnosis',
        'conclusion', 'complication', 'biopsy', 'followUp'
      ];

      Object.entries(formData).forEach(([fieldId, value]) => {
        if (commonFieldIds.includes(fieldId)) {
          commonFields[fieldId] = value;
        } else {
          specificFields[fieldId] = value;
        }
      });

      const payload = {
        prescriptionId,
        patientId,
        examType: procedure,
        commonFields,
        specificFields,
        doctorName
      };

      await fetch(apiUrl('/api/resultats'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/rapport");
      }, 1500);
      
    } catch (err) {
      console.error("Erreur submission:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!config) {
    return (
      <AppShell>
        <div className={PAGE_CONTENT_CLASS}>
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl opacity-30 mb-4">error_outline</span>
            <p className="text-on-surface-variant">Type d'endoscopie non trouvé</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        {isSuccess && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg flex items-center gap-3 text-green-700 font-semibold animate-in fade-in slide-in-from-top">
            <span className="material-symbols-outlined">check_circle</span>
            Résultat validé avec succès !
          </div>
        )}

        {/* En-tête avec type d'endoscopie */}
        <div className="mb-8 flex items-center gap-4 p-6 bg-surface-container-low/50 rounded-xl border border-outline-variant/10">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white`} 
               style={{ backgroundColor: config.color === 'primary' ? '#1f3a93' : '#166534' }}>
            <span className="material-symbols-outlined">{config.icon}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-headline font-bold text-on-surface">{config.label}</h1>
            <p className="text-sm text-on-surface-variant">
              Patient : <span className="font-semibold">{patientName}</span> • 
              Âge : <span className="font-semibold">{age} ans</span>
            </p>
          </div>
        </div>

        {/* Champ médecin */}
        <div className="mb-8 space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">
            Médecin Responsable
          </label>
          <input
            type="text"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            placeholder="Dr..."
            className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Formulaire dynamique par type d'endoscopie */}
        <EndoscopyFormSection
          examType={procedure}
          formData={formData}
          errors={validationErrors}
          onChange={handleFieldChange}
          disabled={isSubmitting}
        />

        {/* Recommandations spécifiques du type d'endoscopie */}
        {config.recommendations && config.recommendations.length > 0 && (
          <div className="mt-8 p-6 bg-secondary-container/20 border border-secondary/30 rounded-xl">
            <h3 className="font-headline font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">info</span>
              Recommandations pour {config.label}
            </h3>
            <ul className="space-y-2">
              {config.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-on-surface-variant flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-secondary mt-0.5 flex-shrink-0">check_small</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="mt-8 flex gap-3 justify-end">
          <button
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-lg border border-outline-variant/20 text-on-surface-variant font-semibold hover:bg-surface-container-low transition-all disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleValidateResult}
            disabled={isSubmitting || isSuccess}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              isSuccess
                ? 'bg-green-600 text-white'
                : 'bg-primary text-white hover:shadow-lg disabled:opacity-50'
            }`}
          >
            {isSubmitting && <span className="material-symbols-outlined animate-spin">progress_activity</span>}
            {isSuccess ? 'Résultat Validé' : 'Valider le Résultat'}
          </button>
        </div>

        {/* Logs de développement */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-slate-100 rounded-lg font-mono text-[11px] text-slate-700 overflow-auto max-h-[200px]">
            <p className="font-bold mb-2">Configuration Debug:</p>
            <pre>{JSON.stringify({ procedure, configName: config.name, fieldCount: allFields.length }, null, 2)}</pre>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function RapportPage() {
  return <ResultatContent />;
}
