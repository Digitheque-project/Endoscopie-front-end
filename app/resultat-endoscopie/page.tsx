"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { RequireRole } from "@/components/auth/RequireRole";
import { useRouter } from "next/navigation";
import { apiFetch, apiJson } from "@/lib/api";
import { usePatient } from "@/contexts/PatientContext";

const procedureTypeMap: Record<string, TypeExamen> = {
  "fibroscopie digestive haute": "fibroscopie",
  "fibroscopie oeso-gastro-duodénale": "fibroscopie",
  "fibroscopie oeso-gastro-duodenale": "fibroscopie",
  "coloscopie": "coloscopie",
  "rectosigmoïdoscopie": "rectosigmoidoscopie",
  "rectosigmoidoscopie": "rectosigmoidoscopie",
  "ligature de varices oesophagiennes": "ligature_varices",
  "injection de colle biologique": "injection_colle",
  "dilatation oesophagienne": "dilatation_oesophagienne",
  "extraction de corps étranger": "extraction_corps_etranger",
  "extraction de corps etranger": "extraction_corps_etranger",
};

function mapProcedureToExamType(procedure?: string): TypeExamen | null {
  if (!procedure) return null;
  const normalized = procedure.trim().toLowerCase();
  if (procedureTypeMap[normalized]) return procedureTypeMap[normalized];
  if (normalized.includes("fibroscopie")) return "fibroscopie";
  if (normalized.includes("coloscopie")) return "coloscopie";
  if (normalized.includes("rectosigmoid")) return "rectosigmoidoscopie";
  if (normalized.includes("ligature")) return "ligature_varices";
  if (normalized.includes("colle")) return "injection_colle";
  if (normalized.includes("dilatation")) return "dilatation_oesophagienne";
  if (normalized.includes("extraction")) return "extraction_corps_etranger";
  return null;
}

const examTypes = [
  { value: "fibroscopie", label: "Fibroscopie digestive haute", phone: "038 61 740 54" },
  { value: "coloscopie", label: "Coloscopie", phone: "038 61 740 54" },
  { value: "rectosigmoidoscopie", label: "Rectosigmoïdoscopie", phone: "038 61 740 54" },
  { value: "ligature_varices", label: "Ligature de varices œsophagiennes", phone: "038 61 740 54" },
  { value: "injection_colle", label: "Injection de colle biologique", phone: "038 61 740 54" },
  { value: "dilatation_oesophagienne", label: "Dilatation oesophagienne", phone: "038 61 740 54" },
  { value: "extraction_corps_etranger", label: "Extraction de corps étranger", phone: "038 61 740 54" },
];

export type TypeExamen =
  | 'fibroscopie'
  | 'coloscopie'
  | 'rectosigmoidoscopie'
  | 'ligature_varices'
  | 'injection_colle'
  | 'dilatation_oesophagienne'
  | 'extraction_corps_etranger';

export type EndoscopeIdFibroscopie =
  | 'GIF-H180-2909929'
  | 'GIF-H180-2807667'
  | 'GIF-H180-2704289'
  | 'GIF-2704288'
  | 'PCF-H180AL'
  | 'XP-180N'
  | 'GIF-H180J-2317815';

export type EndoscopeIdColoscopie =
  | 'CF-Q160AL'
  | 'CF-H180AI'
  | 'CF-H180AL-68'
  | 'CF-H180AL-74'
  | 'PCF-H180AL';

export type EndoscopeIdLigature =
  | 'GIF-H180-2909929'
  | 'GIF-H180-2807667'
  | 'GIF-H180-2806628'
  | 'GIF-H180-2704289'
  | 'GIF-2704288'
  | 'PCF-H180AL'
  | 'XP-180N'
  | 'GIF-H180J-2317815';

export interface EndoscopeOption {
  id: string;
  modele: string;
  serie?: string;
}

export const ENDOSCOPES_FIBROSCOPIE: EndoscopeOption[] = [
  { id: 'GIF-H180-2909929', modele: 'GIF - H 180', serie: '2909929' },
  { id: 'GIF-H180-2807667', modele: 'GIF - H 180', serie: '2807667' },
  { id: 'GIF-H180-2704289', modele: 'GIF - H 180', serie: '2704289' },
  { id: 'GIF-2704288', modele: 'GIF', serie: '2704288' },
  { id: 'PCF-H180AL', modele: 'PCF - H 180 AL' },
  { id: 'XP-180N', modele: 'XP - 180 N' },
  { id: 'GIF-H180J-2317815', modele: 'GIF H 180 J', serie: '2317815' },
];

export const ENDOSCOPES_COLOSCOPIE: EndoscopeOption[] = [
  { id: 'CF-Q160AL', modele: 'CF-Q160 AL' },
  { id: 'CF-H180AI', modele: 'CF-H180 AI' },
  { id: 'CF-H180AL-68', modele: 'CF-H180 AL', serie: '...68' },
  { id: 'CF-H180AL-74', modele: 'CF-H180 AL', serie: '...74' },
  { id: 'PCF-H180AL', modele: 'PCF - H180 AL' },
];

export const ENDOSCOPES_RECTOSIGMOIDOSCOPIE: EndoscopeOption[] = [
  { id: 'CF-Q160AL', modele: 'CF-Q160 AL' },
  { id: 'CF-H180AI', modele: 'CF-H180 AI' },
  { id: 'CF-H180AL-68', modele: 'CF-H180 AL', serie: '...68' },
  { id: 'CF-H180AL-74', modele: 'CF-H180 AL', serie: '...74' },
];

export const ENDOSCOPES_LIGATURE: EndoscopeOption[] = [
  { id: 'GIF-H180-2909929', modele: 'GIF - H 180', serie: '2909929' },
  { id: 'GIF-H180-2807667', modele: 'GIF - H 180', serie: '2807667' },
  { id: 'GIF-H180-2806628', modele: 'GIF - H 180', serie: '2806628' },
  { id: 'GIF-H180-2704289', modele: 'GIF - H 180', serie: '2704289' },
  { id: 'GIF-2704288', modele: 'GIF', serie: '2704288' },
  { id: 'PCF-H180AL', modele: 'PCF - H 180 AL' },
  { id: 'XP-180N', modele: 'XP - 180 N' },
  { id: 'GIF-H180J-2317815', modele: 'GIF H 180 J', serie: '2317815' },
];

type Genre = "Masculin" | "Féminin";

type ConditionExamen = "anesthesie_locale" | "anesthesie_generale";

type PreDesinfection = "Effectuée" | "Non effectuée";

export interface Responsable {
  nom: string;
  prenoms: string;
  age: number;
  genre: Genre;
  indication: string;
  prescripteur: string;
}

interface Endoscopistes {
  conditionExamen: ConditionExamen;
  operateur: string;
  infirmieres: string;
  medecinAnesthesiste: string;
}

interface Infirmieres {
  medecinAnesthesiste: string;
}

interface RendezVous {
  endoscope: string;
  preDesinfection: PreDesinfection;
  desinfection: string;
  kitLigature?: string;
  elastiquesCharges?: number;
  elastiquesUtilises?: string;
}

interface Constatations {
  preparationColique: string;
  toucherRectal: string;
  anus: string;
  rectum: string;
  sigmoid: string;
  colon: string;
  caecum: string;
  valvuleIleoCaecaie: string;
  ileonTerminal: string;
  oesophage: string;
  cardia: string;
  estomac: string;
  pylore: string;
  duodenum: string;
}

interface CompteRenduEndoscopie {
  typeExamen: TypeExamen;
  responsable: Responsable;
  endoscopistes: Endoscopistes;
  infirmieres: Infirmieres;
  rendezVous: RendezVous;
  constatations: Constatations;
  observations: string;
  conclusion: string;
  recommandations: string;
}

const initialData: CompteRenduEndoscopie = {
  typeExamen: "fibroscopie",
  responsable: {
    nom: "",
    prenoms: "",
    age: 0,
    genre: "Masculin",
    indication: "",
    prescripteur: "",
  },
  endoscopistes: {
    conditionExamen: "anesthesie_locale",
    operateur: "",
    infirmieres: "",
    medecinAnesthesiste: "",
  },
  infirmieres: {
    medecinAnesthesiste: "",
  },
  rendezVous: {
    endoscope: "",
    preDesinfection: "Effectuée",
    desinfection: "",
    kitLigature: "Kit 6 élastiques",
    elastiquesCharges: undefined,
    elastiquesUtilises: "Sonde urinaire",
  },
  constatations: {
    preparationColique: "",
    toucherRectal: "",
    anus: "",
    rectum: "",
    sigmoid: "",
    colon: "",
    caecum: "",
    valvuleIleoCaecaie: "",
    ileonTerminal: "",
    oesophage: "",
    cardia: "",
    estomac: "",
    pylore: "",
    duodenum: "",
  },
  observations: "",
  conclusion: "",
  recommandations: "",
};

function ResultatEndoscopieContent() {
  const router = useRouter();
  const { patientId, prescriptionId, patientName, procedure, age, prescriber } = usePatient();
  const [formData, setFormData] = useState<CompteRenduEndoscopie>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [images, setImages] = useState<{ id: string; url: string; name: string; file: File }[]>([]);

  const mappedProcedureType = mapProcedureToExamType(procedure);

  const dynamicTitle = useMemo(() => {
    // La procédure de la prescription est la source de vérité principale
    if (procedure && procedure.trim()) return `Compte rendu ${procedure.trim()}`;
    // Repli : nom issu du type d'examen interne (si procédure non disponible)
    const selectedExam = examTypes.find((exam) => exam.value === formData.typeExamen);
    if (selectedExam) return `Compte rendu ${selectedExam.label}`;
    return 'Compte rendu';
  }, [procedure, formData.typeExamen]);

  useEffect(() => {
    if (!mappedProcedureType) return;
    setFormData((prev) => {
      if (prev.typeExamen === mappedProcedureType) return prev;
      if (prev.typeExamen !== initialData.typeExamen) return prev;
      return {
        ...prev,
        typeExamen: mappedProcedureType,
      };
    });
  }, [mappedProcedureType]);

  const isLigature = formData.typeExamen === "ligature_varices";
  const isRectosigmoidoscopie = formData.typeExamen === "rectosigmoidoscopie";
  const isColoscopie = formData.typeExamen === "coloscopie";
  const isColoscopieLike = isColoscopie || isRectosigmoidoscopie;
  const isFibroscopie = [
    "fibroscopie",
    "injection_colle",
    "dilatation_oesophagienne",
    "extraction_corps_etranger",
    "ligature_varices",
  ].includes(formData.typeExamen);
  const availableEndoscopes = isLigature
    ? ENDOSCOPES_LIGATURE
    : isRectosigmoidoscopie
    ? ENDOSCOPES_RECTOSIGMOIDOSCOPIE
    : isColoscopieLike
    ? ENDOSCOPES_COLOSCOPIE
    : ENDOSCOPES_FIBROSCOPIE;


  useEffect(() => {
    async function loadData() {
      if (!prescriptionId) return;
      try {
        // Charge le compte rendu existant ET les notes d'opération en parallèle
        const [data, opData] = await Promise.all([
          apiJson<any>(`/api/resultats/${prescriptionId}`).catch(() => null),
          apiJson<any>(`/api/operations/${prescriptionId}`).catch(() => null),
        ]);

        // Auto-remplit depuis les notes d'opération si les champs sont vides
        if (opData && !data) {
          setFormData((prev) => ({
            ...prev,
            observations: opData.observationNotes || prev.observations,
            recommandations: opData.medicalNotes || prev.recommandations,
          }));
        }

        if (data) {
          setFormData((prev) => ({
            ...prev,
            // Si compte rendu vide, pré-remplit observations depuis les notes d'opération
            observations: data.observations || (opData?.observationNotes ?? prev.observations),
            recommandations: data.recommandations || (opData?.medicalNotes ?? prev.recommandations),
            typeExamen: data.typeExamen || prev.typeExamen,
            responsable: {
              nom: data.responsable?.nom || prev.responsable.nom,
              prenoms: data.responsable?.prenoms || prev.responsable.prenoms,
              age: data.responsable?.age !== undefined ? Number(data.responsable.age) : prev.responsable.age,
              genre: data.responsable?.genre || prev.responsable.genre,
              indication: data.responsable?.indication || prev.responsable.indication,
              prescripteur: data.responsable?.prescripteur || prev.responsable.prescripteur,
            },
            endoscopistes: {
              conditionExamen: data.endoscopistes?.conditionExamen || prev.endoscopistes.conditionExamen,
              operateur: data.endoscopistes?.operateur || prev.endoscopistes.operateur,
              infirmieres: data.endoscopistes?.infirmieres || prev.endoscopistes.infirmieres,
              medecinAnesthesiste: data.endoscopistes?.medecinAnesthesiste || prev.endoscopistes.medecinAnesthesiste,
            },
            infirmieres: {
              medecinAnesthesiste: data.infirmieres?.medecinAnesthesiste || prev.infirmieres.medecinAnesthesiste,
            },
            rendezVous: {
              endoscope: data.rendezVous?.endoscope || prev.rendezVous.endoscope,
              preDesinfection: data.rendezVous?.preDesinfection || prev.rendezVous.preDesinfection,
              desinfection: data.rendezVous?.desinfection || prev.rendezVous.desinfection,
              kitLigature: data.rendezVous?.kitLigature || prev.rendezVous.kitLigature,
              elastiquesCharges:
                data.rendezVous?.elastiquesCharges !== undefined
                  ? Number(data.rendezVous.elastiquesCharges)
                  : prev.rendezVous.elastiquesCharges,
              elastiquesUtilises:
                data.rendezVous?.elastiquesUtilises !== undefined
                  ? String(data.rendezVous.elastiquesUtilises)
                  : prev.rendezVous.elastiquesUtilises,
            },
            constatations: {
              preparationColique: data.constatations?.preparationColique || prev.constatations.preparationColique,
              toucherRectal: data.constatations?.toucherRectal || prev.constatations.toucherRectal,
              anus: data.constatations?.anus || prev.constatations.anus,
              rectum: data.constatations?.rectum || prev.constatations.rectum,
              sigmoid: data.constatations?.sigmoid || prev.constatations.sigmoid,
              colon: data.constatations?.colon || prev.constatations.colon,
              caecum: data.constatations?.caecum || prev.constatations.caecum,
              valvuleIleoCaecaie: data.constatations?.valvuleIleoCaecaie || prev.constatations.valvuleIleoCaecaie,
              ileonTerminal: data.constatations?.ileonTerminal || prev.constatations.ileonTerminal,
              oesophage: data.constatations?.oesophage || prev.constatations.oesophage,
              cardia: data.constatations?.cardia || prev.constatations.cardia,
              estomac: data.constatations?.estomac || prev.constatations.estomac,
              pylore: data.constatations?.pylore || prev.constatations.pylore,
              duodenum: data.constatations?.duodenum || prev.constatations.duodenum,
            },
          }));
        }
      } catch (err) {
        console.error("Erreur chargement du compte rendu :", err);
      }
    }

    loadData();
  }, [prescriptionId]);

  // Pré-remplit automatiquement le responsable et les informations patient
  // à partir de la prescription (patient, prescripteur, indication clinique).
  useEffect(() => {
    if (!prescriptionId) return;
    let cancelled = false;

    async function autofillResponsable() {
      try {
        const data = await apiJson<any>(`/api/confirmations-planification/${prescriptionId}`).catch(() => null);
        const details = data?.detailsPrescription;
        if (cancelled) return;

        setFormData((prev) => {
          if (prev.responsable.nom) return prev;

          if (details?.patient) {
            return {
              ...prev,
              responsable: {
                ...prev.responsable,
                nom: details.patient.nom || prev.responsable.nom,
                prenoms: details.patient.prenoms || prev.responsable.prenoms,
                age: details.patient.age ?? prev.responsable.age,
                genre: details.patient.genre || prev.responsable.genre,
                indication: details.indicationClinique || prev.responsable.indication,
                prescripteur: details.prescripteur || prev.responsable.prescripteur,
              },
            };
          }

          // Repli sur les infos du contexte patient si la prescription est indisponible
          const [nom, ...rest] = (patientName || "").trim().split(/\s+/);
          if (!nom) return prev;
          return {
            ...prev,
            responsable: {
              ...prev.responsable,
              nom,
              prenoms: rest.join(" "),
              age: age ? Number(age) : prev.responsable.age,
              prescripteur: prescriber || prev.responsable.prescripteur,
            },
          };
        });
      } catch (err) {
        console.error("Erreur lors du pré-remplissage du responsable :", err);
      }
    }

    autofillResponsable();
    return () => {
      cancelled = true;
    };
  }, [prescriptionId, patientName, age, prescriber]);

  const updateField = <K extends keyof CompteRenduEndoscopie>(key: K, value: CompteRenduEndoscopie[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateNested = <S extends keyof CompteRenduEndoscopie, K extends keyof CompteRenduEndoscopie[S]>(
    section: S,
    key: K,
    value: CompteRenduEndoscopie[S][K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [key]: value,
      },
    } as CompteRenduEndoscopie));
  };

  const handleAddImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newImages = Array.from(files).map((file) => ({
      id: `${Date.now()}-${file.name}`,
      url: URL.createObjectURL(file),
      name: file.name,
      file,
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!prescriptionId || !patientId) return;

      const payload = {
        prescriptionId,
        patientId,
        ...formData,
      };

      await apiFetch("/api/resultats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/rapport");
      }, 1200);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du compte rendu :", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 pb-24">
      <div className="flex justify-center">
        <div className="max-w-[1100px] w-full px-4 py-8">
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">Service d'endoscopie — CHU Fianarantsoa</p>
                <h1 className="mt-3 text-3xl font-bold text-slate-900">{dynamicTitle}</h1>
              </div>
              <div className="text-right text-sm text-slate-600">
                <p>Patient : <span className="font-semibold">{patientName || '—'}</span></p>
                <p>Âge : <span className="font-semibold">{age || '—'}</span></p>
              </div>
            </div>
          </div>

          {isSuccess && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm">
              Compte rendu enregistré avec succès.
            </div>
          )}

          <div className="space-y-8">
            <section className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold mb-2">1. Type d'examen</p>
              {examTypes.find((e) => e.value === formData.typeExamen) && (
                <span className="inline-block rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-900">
                  {examTypes.find((e) => e.value === formData.typeExamen)?.label}
                </span>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">2. Responsable</p>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                {/* Colonne gauche : Responsable */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">Responsable</h3>
                  <label className="space-y-2 text-sm text-slate-700">
                    Nom de la responsable
                    <input
                      value={formData.responsable.nom}
                      onChange={(e) => updateNested("responsable", "nom", e.target.value)}
                      placeholder="Copier ou saisir le nom"
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
                    Indication
                    <input
                      value={formData.responsable.indication}
                      onChange={(e) => updateNested("responsable", "indication", e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
                    Prescripteur
                    <input
                      value={formData.responsable.prescripteur}
                      onChange={(e) => updateNested("responsable", "prescripteur", e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                </div>

                {/* Colonne droite : Infos Patient */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">Informations du patient</h3>
                  <label className="space-y-2 text-sm text-slate-700">
                    Nom
                    <input
                      value={formData.responsable.nom}
                      onChange={(e) => updateNested("responsable", "nom", e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-700">
                    Prénom(s)
                    <input
                      value={formData.responsable.prenoms}
                      onChange={(e) => updateNested("responsable", "prenoms", e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-700">
                      Âge
                      <input
                        type="number"
                        min={0}
                        value={formData.responsable.age}
                        onChange={(e) => updateNested("responsable", "age", e.target.value ? Number(e.target.value) : 0)}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700">
                      Genre
                      <select
                        value={formData.responsable.genre}
                        onChange={(e) => updateNested("responsable", "genre", e.target.value as Genre)}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                      >
                        <option value="Masculin">Masculin</option>
                        <option value="Féminin">Féminin</option>
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">3. Endoscopistes</p>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 cursor-pointer">
                    <input
                      type="radio"
                      name="conditionExamen"
                      value="anesthesie_locale"
                      checked={formData.endoscopistes.conditionExamen === "anesthesie_locale"}
                      onChange={() => updateNested("endoscopistes", "conditionExamen", "anesthesie_locale")}
                      className="h-4 w-4 text-primary"
                    />
                    <span>Anesthésie locale</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 cursor-pointer">
                    <input
                      type="radio"
                      name="conditionExamen"
                      value="anesthesie_generale"
                      checked={formData.endoscopistes.conditionExamen === "anesthesie_generale"}
                      onChange={() => updateNested("endoscopistes", "conditionExamen", "anesthesie_generale")}
                      className="h-4 w-4 text-primary"
                    />
                    <span>Anesthésie générale</span>
                  </label>
                </div>

                <label className="space-y-2 text-sm text-slate-700">
                  Opérateur
                  <input
                    value={formData.endoscopistes.operateur}
                    onChange={(e) => updateNested("endoscopistes", "operateur", e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  Infirmière(s)
                  <input
                    value={formData.endoscopistes.infirmieres}
                    onChange={(e) => updateNested("endoscopistes", "infirmieres", e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  Médecin anesthésiste
                  <input
                    value={formData.endoscopistes.medecinAnesthesiste}
                    onChange={(e) => updateNested("endoscopistes", "medecinAnesthesiste", e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">4. Rendez-vous & Matériel</p>
              </div>
              <div className="grid gap-4">
                <label className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <span>Endoscope</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">OLYMPUS*</span>
                  </div>
                </label>
              </div>

              {(isFibroscopie || isColoscopieLike || isLigature) && (
                <div className="mt-6">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-900">Sélectionner un endoscope</p>
                    <span className="text-xs uppercase tracking-[0.22em] text-slate-500">1 sélection</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {availableEndoscopes.map((endoscope) => {
                      const selected = formData.rendezVous.endoscope === endoscope.id;
                      return (
                        <button
                          key={endoscope.id}
                          type="button"
                          onClick={() => updateNested("rendezVous", "endoscope", endoscope.id)}
                          className={`rounded-3xl border p-4 text-left transition-all ${selected ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{endoscope.modele}</p>
                              <p className="text-sm text-slate-500">{endoscope.serie ?? 'Série non précisée'}</p>
                            </div>
                            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-sm ${selected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-slate-400'}`}>
                              {selected ? '✓' : ''}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <span>Pré-désinfection</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">HEXANIOS*</span>
                  </div>
                  <select
                    value={formData.rendezVous.preDesinfection}
                    onChange={(e) => updateNested("rendezVous", "preDesinfection", e.target.value as PreDesinfection)}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                  >
                    <option value="Effectuée">Effectuée</option>
                    <option value="Non effectuée">Non effectuée</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <span>Désinfection</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">STERANIOS*</span>
                  </div>
                  <input
                    value={formData.rendezVous.desinfection}
                    onChange={(e) => updateNested("rendezVous", "desinfection", e.target.value)}
                    placeholder="Saisir la désinfection"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </label>
              </div>

              {isLigature && (
                <div className="mt-6 grid gap-4">
                  <div className="text-sm font-semibold text-slate-900">Kit ligature</div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      'Euroligator*',
                      'Micro-tech*',
                      'Kit rechargeable',
                      'Boston*',
                    ].map((option) => {
                      const selected = formData.rendezVous.kitLigature === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => updateNested("rendezVous", "kitLigature", option)}
                          className={`rounded-3xl border p-4 text-left transition-all ${selected ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{option}</p>
                              <p className="text-sm text-slate-500">&nbsp;</p>
                            </div>
                            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-sm ${selected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-slate-400'}`}>
                              {selected ? '✓' : ''}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-700">
                      Nombre d'élastiques chargés
                      <input
                        type="number"
                        min={0}
                        value={formData.rendezVous.elastiquesCharges ?? ''}
                        onChange={(e) => updateNested("rendezVous", "elastiquesCharges", e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700">
                      Élastiques utilisés
                      <input
                          type="text"
                          value={formData.rendezVous.elastiquesUtilises ?? ''}
                          onChange={(e) => updateNested("rendezVous", "elastiquesUtilises", e.target.value)}
                          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />
                    </label>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">5. Images de l'examen</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">Captures endoscopiques</h2>
                </div>
                {images.length > 0 && (
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {images.length} image{images.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {images.map((img) => (
                  <div key={img.id} className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img.id)}
                      className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Supprimer l'image"
                    >
                      ✕
                    </button>
                    <p className="absolute inset-x-0 bottom-0 truncate bg-slate-900/60 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {img.name}
                    </p>
                  </div>
                ))}

                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-center transition-colors hover:border-primary hover:bg-primary/5">
                  <span className="text-2xl leading-none text-slate-400">+</span>
                  <span className="text-xs font-semibold text-slate-600">Importer une image</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleAddImages(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              <p className="mt-4 text-xs text-slate-500">Formats acceptés : JPG, PNG. Les images sont jointes au compte rendu de l'examen.</p>
            </section>

            {isColoscopie && (
              <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm mb-6">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  <span className="font-bold">6. Quantité de la préparation colique</span>
                  <span className="font-normal"> : Score de Boston 9/9</span>
                </p>
              </section>
            )}

            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="grid gap-6">
                {(
                  isFibroscopie
                    ? ([
                        { label: "Oesophage", key: "oesophage" as const },
                        { label: "Cardia", key: "cardia" as const },
                        { label: "Estomac", key: "estomac" as const },
                        { label: "Pylore", key: "pylore" as const },
                        { label: "Duodénum", key: "duodenum" as const },
                      ] as const)
                    : isRectosigmoidoscopie
                    ? ([
                        { label: "Anus", key: "anus" as const },
                        { label: "Rectum", key: "rectum" as const },
                        { label: "Sigmoïde", key: "sigmoid" as const },
                      ] as const)
                    : ([
                        { label: "Toucher rectal", key: "toucherRectal" as const },
                        { label: "Anus", key: "anus" as const },
                        { label: "Rectum", key: "rectum" as const },
                        { label: "Colon", key: "colon" as const },
                        { label: "Caecum", key: "caecum" as const },
                        { label: "Valvule iléo-caecaie", key: "valvuleIleoCaecaie" as const },
                        { label: "Iléon terminal", key: "ileonTerminal" as const },
                      ] as const)
                ).map((item) => (
                  <div key={item.key} className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{item.label}</h3>
                        <p className="text-xs text-slate-500">[au besoin]</p>
                      </div>
                    </div>
                    <textarea
                      value={formData.constatations[item.key]}
                      onChange={(e) => updateNested("constatations", item.key, e.target.value)}
                      placeholder="[à remplir]"
                      rows={3}
                      className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-relaxed focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">7. Conclusion</p>
              </div>
              <textarea
                value={formData.conclusion}
                onChange={(e) => updateField("conclusion", e.target.value)}
                placeholder="[à remplir]"
                rows={6}
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-relaxed focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </section>

            {!isRectosigmoidoscopie && (
              <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">8. Recommandations</p>
                </div>
                <textarea
                  value={formData.recommandations}
                  onChange={(e) => updateField("recommandations", e.target.value)}
                  placeholder="[à remplir]"
                  rows={4}
                  className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-relaxed focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </section>
            )}
          </div>

        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 py-4 shadow-[0_-1px_10px_rgba(15,23,42,0.08)] backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Retour
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Enregistrement..." : "Enregistrer le compte rendu"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResultatEndoscopiePage() {
  return (
    <AppShell>
      <div className={PAGE_CONTENT_CLASS}>
        <RequireRole role="MEDECIN">
          <ResultatEndoscopieContent />
        </RequireRole>
      </div>
    </AppShell>
  );
}
