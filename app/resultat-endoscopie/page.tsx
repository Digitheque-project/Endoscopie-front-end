"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AppShell, PAGE_CONTENT_CLASS } from "@/components/layout/AppShell";
import { RequireRole } from "@/components/auth/RequireRole";
import { useRouter } from "next/navigation";
import { apiFetch, apiJson } from "@/lib/api";
import { usePatient } from "@/contexts/PatientContext";
import { useAuth } from "@/contexts/AuthContext";
import MicButton from "@/components/voice/MicButton";
import { appendFinalSegment } from "@/components/voice/formatTranscript";
import {
  type TypeExamen,
  type Constatations,
  type ConstatationField,
  mapProcedureToExamType,
  getConstatationsFields,
} from "@/lib/examOrgans";
import { fetchSessionSiblings, type SessionInfo } from "@/lib/exam-session";
import { getExamTypeBadgeClass } from "@/lib/exam-type-colors";

// ---------------------------------------------------------------------------
// Dictée globale des constatations — parser organe → champ
// ---------------------------------------------------------------------------
type ConstatationKey = keyof Constatations;

const ORGAN_PATTERNS: Array<{ re: RegExp; field: ConstatationKey }> = [
  { re: /toucher\s+rectal/gi,                                   field: 'toucherRectal' },
  { re: /pr[eé]paration\s+colique/gi,                           field: 'preparationColique' },
  { re: /il[eé]on\s+terminal/gi,                                field: 'ileonTerminal' },
  { re: /valvule(?:\s+il[eé]o[-\s]*ca?[eé]c\w*)?/gi,          field: 'valvuleIleoCaecaie' },
  { re: /(?:oe|œ|[eé])sophage/gi,                              field: 'oesophage' },
  { re: /cardia/gi,                                             field: 'cardia' },
  { re: /estomac/gi,                                            field: 'estomac' },
  { re: /p[yi]lore?/gi,                                        field: 'pylore' },
  { re: /duod[eé]num/gi,                                       field: 'duodenum' },
  { re: /c[aâ]ecum/gi,                                         field: 'caecum' },
  { re: /il[eé]on/gi,                                          field: 'ileonTerminal' },
  { re: /sigmo[ïi]d[eé]?/gi,                                   field: 'sigmoid' },
  { re: /c[oô]lon/gi,                                          field: 'colon' },
  { re: /rectum/gi,                                            field: 'rectum' },
  { re: /\banus\b/gi,                                          field: 'anus' },
];

function parseConstatationsText(text: string): Partial<Constatations> {
  type M = { index: number; end: number; field: ConstatationKey };
  const all: M[] = [];

  for (const { re, field } of ORGAN_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      all.push({ index: m.index, end: m.index + m[0].length, field });
    }
  }

  // sort by position; longer match wins on ties
  all.sort((a, b) => a.index - b.index || (b.end - b.index) - (a.end - a.index));

  // remove overlapping
  const matches: M[] = [];
  for (const m of all) {
    if (!matches.some(p => m.index < p.end)) matches.push(m);
  }

  if (matches.length === 0) return {};

  const result: Partial<Constatations> = {};
  for (let i = 0; i < matches.length; i++) {
    const { end, field } = matches[i];
    const nextStart = matches[i + 1]?.index ?? text.length;
    const content = text.slice(end, nextStart)
      .trim()
      .replace(/^[:\s,;.]+/, '')
      .replace(/[.\s,;]+$/, '')
      .trim();
    if (content) result[field] = content;
  }
  return result;
}

// ---------------------------------------------------------------------------

const examTypes = [
  { value: "fibroscopie", label: "Fibroscopie digestive haute", phone: "038 61 740 54" },
  { value: "coloscopie", label: "Coloscopie", phone: "038 61 740 54" },
  { value: "rectosigmoidoscopie", label: "Rectosigmoïdoscopie", phone: "038 61 740 54" },
  { value: "ligature_varices", label: "Ligature de varices œsophagiennes", phone: "038 61 740 54" },
  { value: "injection_colle", label: "Injection de colle biologique", phone: "038 61 740 54" },
  { value: "dilatation_oesophagienne", label: "Dilatation oesophagienne", phone: "038 61 740 54" },
  { value: "extraction_corps_etranger", label: "Extraction de corps étranger", phone: "038 61 740 54" },
];

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

// Sections spécifiques par type thérapeutique
interface LigatureSpecifique {
  gradeVarices: string;
  nombreLigatures: string;
  saignementActif: string;
  resultat: string;
}

interface InjectionColleSpecifique {
  siteInjection: string;
  typeColle: string;
  volumeInjecte: string;
  nombreSeances: string;
  resultat: string;
}

interface DilatationSpecifique {
  indication: string;
  localisationStenose: string;
  calibreAvant: string;
  calibreApres: string;
  typeDilatateur: string;
  resultat: string;
  complication: string;
}

interface ExtractionSpecifique {
  natureCE: string;
  localisation: string;
  technique: string;
  resultat: string;
  complication: string;
}

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
  endoscope: string[];
  preDesinfection: PreDesinfection;
  desinfection: string;
  kitLigature?: string[];
  elastiquesCharges?: number;
  elastiquesUtilises?: string;
}

interface CompteRenduEndoscopie {
  typeExamen: TypeExamen;
  responsable: Responsable;
  // Médecin responsable du compte rendu (distinct du patient ci-dessus) — pré-rempli
  // avec le médecin Endoscopie connecté, voir loadData.
  responsableExamen: string;
  endoscopistes: Endoscopistes;
  infirmieres: Infirmieres;
  rendezVous: RendezVous;
  constatations: Constatations;
  observations: string;
  conclusion: string;
  recommandations: string;
  ligatureSpecifique: LigatureSpecifique;
  injectionSpecifique: InjectionColleSpecifique;
  dilatationSpecifique: DilatationSpecifique;
  extractionSpecifique: ExtractionSpecifique;
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
  responsableExamen: "",
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
    endoscope: [],
    preDesinfection: "Effectuée",
    desinfection: "",
    kitLigature: [],
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
  ligatureSpecifique: {
    gradeVarices: "",
    nombreLigatures: "",
    saignementActif: "",
    resultat: "",
  },
  injectionSpecifique: {
    siteInjection: "",
    typeColle: "",
    volumeInjecte: "",
    nombreSeances: "",
    resultat: "",
  },
  dilatationSpecifique: {
    indication: "",
    localisationStenose: "",
    calibreAvant: "",
    calibreApres: "",
    typeDilatateur: "",
    resultat: "",
    complication: "",
  },
  extractionSpecifique: {
    natureCE: "",
    localisation: "",
    technique: "",
    resultat: "",
    complication: "",
  },
};

function ResultatEndoscopieContent() {
  const router = useRouter();
  const { patientId, prescriptionId, patientName, procedure, age, prescriber, setPatientData } = usePatient();
  const { role, medecinName } = useAuth();
  const [formData, setFormData] = useState<CompteRenduEndoscopie>(() => ({
    ...initialData,
    typeExamen: mapProcedureToExamType(procedure) ?? initialData.typeExamen,
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  // Un compte rendu existe déjà pour cet examen (consultation depuis les Archives) :
  // simple lecture, le bouton d'enregistrement n'a plus lieu d'être.
  const [hasExistingResult, setHasExistingResult] = useState(false);
  // Session groupée (plusieurs examens du même patient sur le même créneau) — permet
  // d'enchaîner la rédaction du compte-rendu procédure par procédure sans quitter la page.
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    if (!prescriptionId) {
      setSession(null);
      return;
    }
    let cancelled = false;
    fetchSessionSiblings(prescriptionId)
      .then((s) => { if (!cancelled) setSession(s); })
      .catch(() => { if (!cancelled) setSession(null); });
    return () => { cancelled = true; };
  }, [prescriptionId]);
  // Simple référence de ce qui a été dicté par organe pendant l'opération (à côté du
  // libellé) — n'alimente plus le champ officiel du médecin en dessous, voir loadData.
  const [parsedOrganNotes, setParsedOrganNotes] = useState<Partial<Constatations>>({});
  const [images, setImages] = useState<{ id: string; url: string; name: string; file: File }[]>([]);

  const dynamicTitle = useMemo(() => {
    const selectedExam = examTypes.find((exam) => exam.value === formData.typeExamen);
    return selectedExam ? `Compte rendu ${selectedExam.label}` : 'Compte rendu';
  }, [formData.typeExamen]);

  const typeExamen = formData.typeExamen;
  const isLigature = typeExamen === "ligature_varices";
  const isRectosigmoidoscopie = typeExamen === "rectosigmoidoscopie";
  const isColoscopie = typeExamen === "coloscopie";
  const isColoscopieLike = isColoscopie || isRectosigmoidoscopie;
  const availableEndoscopes = isLigature
    ? ENDOSCOPES_LIGATURE
    : isRectosigmoidoscopie
    ? ENDOSCOPES_RECTOSIGMOIDOSCOPIE
    : isColoscopieLike
    ? ENDOSCOPES_COLOSCOPIE
    : ENDOSCOPES_FIBROSCOPIE;

  const constatationsFields = getConstatationsFields(typeExamen);

  const hasSpecifique = isLigature
    || typeExamen === 'injection_colle'
    || typeExamen === 'dilatation_oesophagienne'
    || typeExamen === 'extraction_corps_etranger';

  // Numérotation dynamique — sections 1-5 toujours présentes
  let _n = 5;
  const nextN = () => ++_n;
  const sNum = {
    preparationColique: isColoscopie          ? nextN() : 0,
    constatations:                              nextN(),
    specifique:         hasSpecifique          ? nextN() : 0,
    conclusion:                                 nextN(),
    recommandations:    !isRectosigmoidoscopie ? nextN() : 0,
  };
  // Nombre total de sections du formulaire (varie selon le type d'examen) — affiché en
  // repère au médecin, ce long formulaire n'ayant sinon aucune indication de progression.
  const totalSections = _n;


  useEffect(() => {
    async function loadData() {
      if (!prescriptionId) return;
      // Réinitialisation immédiate — en session groupée, évite que les champs de
      // l'examen précédent restent affichés le temps que la nouvelle requête réponde.
      setFormData({ ...initialData, typeExamen: mapProcedureToExamType(procedure) ?? initialData.typeExamen });
      setParsedOrganNotes({});
      setImages([]);
      setHasExistingResult(false);
      try {
        // Charge en parallèle : compte rendu existant, notes d'opération, et prescription (source de vérité du type)
        const [data, opData, prescriptionData] = await Promise.all([
          apiJson<any>(`/api/resultats/${prescriptionId}`).catch(() => null),
          apiJson<any>(`/api/operations/${prescriptionId}`).catch(() => null),
          apiJson<any>(`/api/prescriptions/${prescriptionId}`).catch(() => null),
        ]);

        // Détecte automatiquement le type d'examen depuis la prescription (source la plus fiable)
        const detectedType =
          mapProcedureToExamType(prescriptionData?.typeExamen) ||
          mapProcedureToExamType(procedure) ||
          (data?.details?.typeExamen as TypeExamen | undefined) ||
          null;
        if (detectedType) {
          setFormData((prev) => prev.typeExamen === detectedType ? prev : { ...prev, typeExamen: detectedType });
        }

        // Ce qui a été dicté organe par organe pendant l'opération — affiché en simple
        // référence à côté de chaque champ pendant la rédaction du compte rendu. Une
        // fois le compte rendu enregistré (consultation depuis les Archives), ces notes
        // de dictée n'ont plus lieu d'être affichées à côté du résultat final.
        if (opData?.observationNotes && !data) {
          setParsedOrganNotes(parseConstatationsText(opData.observationNotes));
        }

        // Auto-remplit "Note(s) complémentaire(s)" depuis les Notes complémentaires de
        // l'opération (medicalNotes) si le champ est vide
        if (opData && !data) {
          setFormData((prev) => ({
            ...prev,
            observations: opData.medicalNotes || prev.observations,
          }));
        }

        if (data) {
          setHasExistingResult(true);
          setFormData((prev) => ({
            ...prev,
            // Si compte rendu vide, pré-remplit depuis les Notes complémentaires de l'opération
            observations: data.observations || (opData?.medicalNotes ?? prev.observations),
            conclusion: data.conclusion || prev.conclusion,
            recommandations: data.recommandations || (opData?.medicalNotes ?? prev.recommandations),
            typeExamen: detectedType || (data.details?.typeExamen as TypeExamen | undefined) || prev.typeExamen,
            responsableExamen: data.responsableExamen || prev.responsableExamen,
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
              // Comptes rendus enregistrés avant le passage à la sélection multiple :
              // `endoscope` y est encore une simple chaîne — on la normalise en tableau.
              endoscope: Array.isArray(data.rendezVous?.endoscope)
                ? data.rendezVous.endoscope
                : data.rendezVous?.endoscope
                ? [data.rendezVous.endoscope]
                : prev.rendezVous.endoscope,
              preDesinfection: data.rendezVous?.preDesinfection || prev.rendezVous.preDesinfection,
              desinfection: data.rendezVous?.desinfection || prev.rendezVous.desinfection,
              // Comptes rendus enregistrés avant le passage à la sélection multiple :
              // `kitLigature` y est encore une simple chaîne — on la normalise en tableau.
              kitLigature: Array.isArray(data.rendezVous?.kitLigature)
                ? data.rendezVous.kitLigature
                : data.rendezVous?.kitLigature
                ? [data.rendezVous.kitLigature]
                : prev.rendezVous.kitLigature,
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
            ligatureSpecifique: {
              gradeVarices: data.ligatureSpecifique?.gradeVarices || prev.ligatureSpecifique.gradeVarices,
              nombreLigatures: data.ligatureSpecifique?.nombreLigatures || prev.ligatureSpecifique.nombreLigatures,
              saignementActif: data.ligatureSpecifique?.saignementActif || prev.ligatureSpecifique.saignementActif,
              resultat: data.ligatureSpecifique?.resultat || prev.ligatureSpecifique.resultat,
            },
            injectionSpecifique: {
              siteInjection: data.injectionSpecifique?.siteInjection || prev.injectionSpecifique.siteInjection,
              typeColle: data.injectionSpecifique?.typeColle || prev.injectionSpecifique.typeColle,
              volumeInjecte: data.injectionSpecifique?.volumeInjecte || prev.injectionSpecifique.volumeInjecte,
              nombreSeances: data.injectionSpecifique?.nombreSeances || prev.injectionSpecifique.nombreSeances,
              resultat: data.injectionSpecifique?.resultat || prev.injectionSpecifique.resultat,
            },
            dilatationSpecifique: {
              indication: data.dilatationSpecifique?.indication || prev.dilatationSpecifique.indication,
              localisationStenose: data.dilatationSpecifique?.localisationStenose || prev.dilatationSpecifique.localisationStenose,
              calibreAvant: data.dilatationSpecifique?.calibreAvant || prev.dilatationSpecifique.calibreAvant,
              calibreApres: data.dilatationSpecifique?.calibreApres || prev.dilatationSpecifique.calibreApres,
              typeDilatateur: data.dilatationSpecifique?.typeDilatateur || prev.dilatationSpecifique.typeDilatateur,
              resultat: data.dilatationSpecifique?.resultat || prev.dilatationSpecifique.resultat,
              complication: data.dilatationSpecifique?.complication || prev.dilatationSpecifique.complication,
            },
            extractionSpecifique: {
              natureCE: data.extractionSpecifique?.natureCE || prev.extractionSpecifique.natureCE,
              localisation: data.extractionSpecifique?.localisation || prev.extractionSpecifique.localisation,
              technique: data.extractionSpecifique?.technique || prev.extractionSpecifique.technique,
              resultat: data.extractionSpecifique?.resultat || prev.extractionSpecifique.resultat,
              complication: data.extractionSpecifique?.complication || prev.extractionSpecifique.complication,
            },
          }));
        } else if (role === "MEDECIN" && medecinName) {
          // Nouveau compte rendu (rien à restaurer) : pré-remplit le nom de la
          // responsable et l'opérateur avec le médecin Endoscopie connecté — évite une
          // ressaisie manuelle à chaque examen.
          const doctorLabel = `Dr. ${medecinName}`;
          setFormData((prev) => ({
            ...prev,
            responsableExamen: prev.responsableExamen || doctorLabel,
            endoscopistes: {
              ...prev.endoscopistes,
              operateur: prev.endoscopistes.operateur || doctorLabel,
            },
          }));
        }
      } catch (err) {
        console.error("Erreur chargement du compte rendu :", err);
      }
    }

    loadData();
  }, [prescriptionId, procedure, role, medecinName]);

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

  // Choix manuel de l'examen à rédiger en premier (ou à tout moment) — la position
  // n'a rien d'imposé, contrairement au chaînage automatique après enregistrement
  // (handleSubmit ci-dessous), qui lui suit l'ordre "premier sans compte-rendu".
  const handleChooseExam = (exam: SessionInfo["exams"][number]) => {
    if (exam.id === prescriptionId) return;
    setPatientData({ prescriptionId: exam.id, procedure: exam.typeExamen });
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
      // Session groupée : enchaîne sur l'examen suivant DE LA LISTE (position dans
      // session.exams) — même logique que l'opération — plutôt que "le premier sans
      // compte-rendu", pour un ordre prévisible qui couvre bien tous les examens un par un.
      const freshSession = await fetchSessionSiblings(prescriptionId).catch(() => null);
      const currentIndex = freshSession?.exams.findIndex((e) => e.id === prescriptionId) ?? -1;
      const next =
        freshSession && currentIndex >= 0 && currentIndex < freshSession.exams.length - 1
          ? freshSession.exams[currentIndex + 1]
          : null;
      setTimeout(() => {
        if (next) {
          setPatientData({ prescriptionId: next.id, procedure: next.typeExamen });
          setIsSuccess(false);
        } else {
          router.push("/");
        }
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
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {session?.sameSlot && session.exams.length > 1 && (
                    // Choix manuel de l'examen à rédiger — pas seulement un indicateur de
                    // position : cliquer bascule directement dessus (voir handleChooseExam),
                    // sans attendre l'enchaînement automatique après enregistrement.
                    session.exams.map((exam) => (
                      <button
                        key={exam.id}
                        type="button"
                        onClick={() => handleChooseExam(exam)}
                        title={`Rédiger le compte rendu de « ${exam.typeExamen} »`}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${getExamTypeBadgeClass(exam.typeExamen)} ${
                          exam.id === prescriptionId ? "ring-2 ring-blue-400 shadow-sm" : "opacity-70 hover:opacity-100"
                        }`}
                      >
                        {exam.hasResultat && <span className="material-symbols-outlined text-[14px]">check_circle</span>}
                        {exam.typeExamen}
                      </button>
                    ))
                  )}
                  {!hasExistingResult && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      <span className="material-symbols-outlined text-[14px]">format_list_numbered</span>
                      Formulaire en {totalSections} sections
                    </span>
                  )}
                </div>
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

          {hasExistingResult && (
            <div className="mb-6 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-4 text-slate-700 shadow-sm">
              <span className="material-symbols-outlined text-lg">lock</span>
              Compte rendu déjà enregistré — lecture seule.
            </div>
          )}

          <fieldset disabled={hasExistingResult} className="space-y-5 border-0 p-0 m-0 min-w-0">

            <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">2. Responsable</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {/* Colonne gauche : Responsable */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">Responsable</h3>
                  <label className="space-y-1 text-sm text-slate-700">
                    Nom de la responsable
                    <input
                      value={formData.responsableExamen}
                      onChange={(e) => updateField("responsableExamen", e.target.value)}
                      placeholder="Copier ou saisir le nom"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
                    Indication
                    <input
                      value={formData.responsable.indication}
                      onChange={(e) => updateNested("responsable", "indication", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
                    Prescripteur
                    <input
                      value={formData.responsable.prescripteur}
                      onChange={(e) => updateNested("responsable", "prescripteur", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                </div>

                {/* Colonne droite : Infos Patient */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">Informations du patient</h3>
                  <label className="space-y-1 text-sm text-slate-700">
                    Nom
                    <input
                      value={formData.responsable.nom}
                      onChange={(e) => updateNested("responsable", "nom", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    Prénom(s)
                    <input
                      value={formData.responsable.prenoms}
                      onChange={(e) => updateNested("responsable", "prenoms", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm text-slate-700">
                      Âge
                      <input
                        type="number"
                        min={0}
                        value={formData.responsable.age}
                        onChange={(e) => updateNested("responsable", "age", e.target.value ? Number(e.target.value) : 0)}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>
                    <label className="space-y-1 text-sm text-slate-700">
                      Genre
                      <select
                        value={formData.responsable.genre}
                        onChange={(e) => updateNested("responsable", "genre", e.target.value as Genre)}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                      >
                        <option value="Masculin">Masculin</option>
                        <option value="Féminin">Féminin</option>
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">3. Endoscopistes</p>
              </div>
              <div className="grid gap-3">
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

                <label className="space-y-1 text-sm text-slate-700">
                  Opérateur
                  <input
                    value={formData.endoscopistes.operateur}
                    onChange={(e) => updateNested("endoscopistes", "operateur", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-700">
                  Infirmière(s)
                  <input
                    value={formData.endoscopistes.infirmieres}
                    onChange={(e) => updateNested("endoscopistes", "infirmieres", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-700">
                  Médecin anesthésiste
                  <input
                    value={formData.endoscopistes.medecinAnesthesiste}
                    onChange={(e) => updateNested("endoscopistes", "medecinAnesthesiste", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </label>
              </div>
            </section>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">4. Rendez-vous & Matériel</p>
              </div>
              <div className="grid gap-3">
                <label className="space-y-1 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <span>Endoscope</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">OLYMPUS*</span>
                  </div>
                </label>
              </div>

              {(
                <div className="mt-6">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-900">Sélectionner un ou plusieurs endoscopes</p>
                    <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      {formData.rendezVous.endoscope.length} sélection{formData.rendezVous.endoscope.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {availableEndoscopes.map((endoscope) => {
                      const selected = formData.rendezVous.endoscope.includes(endoscope.id);
                      return (
                        <button
                          key={endoscope.id}
                          type="button"
                          onClick={() =>
                            updateNested(
                              "rendezVous",
                              "endoscope",
                              selected
                                ? formData.rendezVous.endoscope.filter((id) => id !== endoscope.id)
                                : [...formData.rendezVous.endoscope, endoscope.id],
                            )
                          }
                          className={`rounded-3xl border p-4 text-left transition-all ${selected ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{endoscope.modele}</p>
                              <p className="text-sm text-slate-500">{endoscope.serie ?? 'Série non précisée'}</p>
                            </div>
                            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md border text-sm ${selected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-slate-400'}`}>
                              {selected ? '✓' : ''}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <label className="space-y-1 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <span>Pré-désinfection</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">HEXANIOS*</span>
                  </div>
                  <select
                    value={formData.rendezVous.preDesinfection}
                    onChange={(e) => updateNested("rendezVous", "preDesinfection", e.target.value as PreDesinfection)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                  >
                    <option value="Effectuée">Effectuée</option>
                    <option value="Non effectuée">Non effectuée</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <span>Désinfection</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">STERANIOS*</span>
                  </div>
                  <input
                    value={formData.rendezVous.desinfection}
                    onChange={(e) => updateNested("rendezVous", "desinfection", e.target.value)}
                    placeholder="Saisir la désinfection"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </label>
              </div>

              {isLigature && (
                <div className="mt-6 grid gap-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-semibold text-slate-900">Kit ligature</div>
                    <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      {(formData.rendezVous.kitLigature ?? []).length} sélection{(formData.rendezVous.kitLigature ?? []).length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      'Euroligator*',
                      'Micro-tech*',
                      'Kit rechargeable',
                      'Boston*',
                    ].map((option) => {
                      const current = formData.rendezVous.kitLigature ?? [];
                      const selected = current.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            updateNested(
                              "rendezVous",
                              "kitLigature",
                              selected ? current.filter((o) => o !== option) : [...current, option],
                            )
                          }
                          className={`rounded-3xl border p-4 text-left transition-all ${selected ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{option}</p>
                              <p className="text-sm text-slate-500">&nbsp;</p>
                            </div>
                            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md border text-sm ${selected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-slate-400'}`}>
                              {selected ? '✓' : ''}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm text-slate-700">
                      Nombre d'élastiques chargés
                      <input
                        type="number"
                        min={0}
                        value={formData.rendezVous.elastiquesCharges ?? ''}
                        onChange={(e) => updateNested("rendezVous", "elastiquesCharges", e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>
                    <label className="space-y-1 text-sm text-slate-700">
                      Élastiques utilisés
                      <input
                          type="text"
                          value={formData.rendezVous.elastiquesUtilises ?? ''}
                          onChange={(e) => updateNested("rendezVous", "elastiquesUtilises", e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />
                    </label>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-4">
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
            </div>

            {isColoscopie && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  <span className="font-bold">{sNum.preparationColique}. Quantité de la préparation colique</span>
                  <span className="font-normal"> : Score de Boston 9/9</span>
                </p>
              </section>
            )}

            <div className={`grid grid-cols-1 gap-4 items-start ${formData.observations.trim() ? "lg:grid-cols-[1fr_260px]" : ""}`}>
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">
                    {sNum.constatations}. Observation
                  </p>
                </div>

                <div className="grid gap-4">
                  {constatationsFields.map((item) => (
                    <div key={item.key} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-slate-900">{item.label}</h3>
                          <p className="text-xs text-slate-500">[au besoin]</p>
                          {parsedOrganNotes[item.key] && (
                            <span className="text-xs text-primary bg-primary/5 rounded-full px-2 py-0.5">
                              note : {parsedOrganNotes[item.key]}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-semibold text-slate-500">Dicter à l&apos;oral</span>
                          <MicButton
                            onFinalTranscript={(text, meta) =>
                              updateNested(
                                "constatations",
                                item.key,
                                appendFinalSegment(formData.constatations[item.key], text, Boolean(meta?.startsAfterPause)),
                              )
                            }
                          />
                        </div>
                      </div>
                      <textarea
                        value={formData.constatations[item.key]}
                        onChange={(e) => updateNested("constatations", item.key, e.target.value)}
                        placeholder="[à remplir]"
                        rows={2}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm leading-relaxed focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                  ))}
                </div>
              </section>

              {formData.observations.trim() && (
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">
                      Note(s) complémentaire(s)
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Résumé automatique de ce qui est écrit dans chaque organe ci-contre — modifiable ici.
                    </p>
                  </div>
                  <textarea
                    value={formData.observations}
                    onChange={(e) => updateField("observations", e.target.value)}
                    placeholder="[à remplir]"
                    rows={10}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm leading-relaxed focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </section>
              )}
            </div>

            {/* ── Section spécifique Ligature de varices ─────────────────────── */}
            {isLigature && (
              <section className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm">
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-indigo-600 font-bold">
                    {sNum.specifique}. Ligature de varices
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-700">
                    Grade des varices
                    <select
                      value={formData.ligatureSpecifique.gradeVarices}
                      onChange={(e) => updateNested("ligatureSpecifique", "gradeVarices", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">— Sélectionner —</option>
                      <option>Grade I</option>
                      <option>Grade II</option>
                      <option>Grade III</option>
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    Nombre de ligatures posées
                    <input
                      type="number"
                      min={0}
                      value={formData.ligatureSpecifique.nombreLigatures}
                      onChange={(e) => updateNested("ligatureSpecifique", "nombreLigatures", e.target.value)}
                      placeholder="ex. 6"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    Saignement actif
                    <select
                      value={formData.ligatureSpecifique.saignementActif}
                      onChange={(e) => updateNested("ligatureSpecifique", "saignementActif", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">— Sélectionner —</option>
                      <option>Oui</option>
                      <option>Non</option>
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    Résultat de la procédure
                    <select
                      value={formData.ligatureSpecifique.resultat}
                      onChange={(e) => updateNested("ligatureSpecifique", "resultat", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">— Sélectionner —</option>
                      <option>Hémostase obtenue</option>
                      <option>Hémostase partielle</option>
                      <option>Échec — reprise chirurgicale</option>
                    </select>
                  </label>
                </div>
              </section>
            )}

            {/* ── Section spécifique Injection de colle ───────────────────────── */}
            {typeExamen === 'injection_colle' && (
              <section className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm">
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-indigo-600 font-bold">
                    {sNum.specifique}. Injection de colle biologique
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-700">
                    Site d'injection
                    <select
                      value={formData.injectionSpecifique.siteInjection}
                      onChange={(e) => updateNested("injectionSpecifique", "siteInjection", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">— Sélectionner —</option>
                      <option>Cardial</option>
                      <option>Fundique</option>
                      <option>Oesophagien</option>
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    Type de colle
                    <input
                      value={formData.injectionSpecifique.typeColle}
                      onChange={(e) => updateNested("injectionSpecifique", "typeColle", e.target.value)}
                      placeholder="ex. Histoacryl, Cyanoacrylate"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    Volume injecté (ml)
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={formData.injectionSpecifique.volumeInjecte}
                      onChange={(e) => updateNested("injectionSpecifique", "volumeInjecte", e.target.value)}
                      placeholder="ex. 2"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    Nombre de séances
                    <input
                      type="number"
                      min={1}
                      value={formData.injectionSpecifique.nombreSeances}
                      onChange={(e) => updateNested("injectionSpecifique", "nombreSeances", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
                    Résultat
                    <select
                      value={formData.injectionSpecifique.resultat}
                      onChange={(e) => updateNested("injectionSpecifique", "resultat", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">— Sélectionner —</option>
                      <option>Hémostase obtenue</option>
                      <option>Hémostase partielle</option>
                      <option>Non obtenue</option>
                    </select>
                  </label>
                </div>
              </section>
            )}

            {/* ── Section spécifique Dilatation oesophagienne ─────────────────── */}
            {typeExamen === 'dilatation_oesophagienne' && (
              <section className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm">
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-indigo-600 font-bold">
                    {sNum.specifique}. Dilatation oesophagienne
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-700">
                    Indication
                    <select
                      value={formData.dilatationSpecifique.indication}
                      onChange={(e) => updateNested("dilatationSpecifique", "indication", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">— Sélectionner —</option>
                      <option>Sténose peptique</option>
                      <option>Sténose anastomotique</option>
                      <option>Sténose tumorale</option>
                      <option>Achalasie</option>
                      <option>Autre</option>
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    Localisation de la sténose
                    <input
                      value={formData.dilatationSpecifique.localisationStenose}
                      onChange={(e) => updateNested("dilatationSpecifique", "localisationStenose", e.target.value)}
                      placeholder="ex. Tiers inférieur oesophage à 35 cm"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    Calibre avant dilatation (mm)
                    <input
                      type="number"
                      min={1}
                      value={formData.dilatationSpecifique.calibreAvant}
                      onChange={(e) => updateNested("dilatationSpecifique", "calibreAvant", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    Calibre après dilatation (mm)
                    <input
                      type="number"
                      min={1}
                      value={formData.dilatationSpecifique.calibreApres}
                      onChange={(e) => updateNested("dilatationSpecifique", "calibreApres", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    Type de dilatateur
                    <select
                      value={formData.dilatationSpecifique.typeDilatateur}
                      onChange={(e) => updateNested("dilatationSpecifique", "typeDilatateur", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">— Sélectionner —</option>
                      <option>Bougie de Savary-Gilliard</option>
                      <option>Ballon pneumatique</option>
                      <option>Sonde de Maloney</option>
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    Résultat
                    <select
                      value={formData.dilatationSpecifique.resultat}
                      onChange={(e) => updateNested("dilatationSpecifique", "resultat", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">— Sélectionner —</option>
                      <option>Bon résultat</option>
                      <option>Résultat partiel</option>
                      <option>Résultat insuffisant</option>
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
                    Complication
                    <select
                      value={formData.dilatationSpecifique.complication}
                      onChange={(e) => updateNested("dilatationSpecifique", "complication", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">— Sélectionner —</option>
                      <option>Aucune</option>
                      <option>Déchirure muqueuse</option>
                      <option>Hémorragie</option>
                      <option>Perforation</option>
                    </select>
                  </label>
                </div>
              </section>
            )}

            {/* ── Section spécifique Extraction de corps étranger ─────────────── */}
            {typeExamen === 'extraction_corps_etranger' && (
              <section className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm">
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-indigo-600 font-bold">
                    {sNum.specifique}. Extraction de corps étranger
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-700">
                    Nature du corps étranger
                    <input
                      value={formData.extractionSpecifique.natureCE}
                      onChange={(e) => updateNested("extractionSpecifique", "natureCE", e.target.value)}
                      placeholder="ex. Bol alimentaire, pile bouton, arête"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    Localisation
                    <select
                      value={formData.extractionSpecifique.localisation}
                      onChange={(e) => updateNested("extractionSpecifique", "localisation", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">— Sélectionner —</option>
                      <option>Oesophage — tiers supérieur</option>
                      <option>Oesophage — tiers moyen</option>
                      <option>Oesophage — tiers inférieur</option>
                      <option>Estomac</option>
                      <option>Duodénum</option>
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    Technique d'extraction
                    <select
                      value={formData.extractionSpecifique.technique}
                      onChange={(e) => updateNested("extractionSpecifique", "technique", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">— Sélectionner —</option>
                      <option>Pince à corps étranger</option>
                      <option>Filet de récupération</option>
                      <option>Anse diathermique</option>
                      <option>Sonde à panier de Dormia</option>
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    Résultat
                    <select
                      value={formData.extractionSpecifique.resultat}
                      onChange={(e) => updateNested("extractionSpecifique", "resultat", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">— Sélectionner —</option>
                      <option>Extraction complète</option>
                      <option>Extraction partielle</option>
                      <option>Abandon — orientation chirurgicale</option>
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
                    Complication
                    <select
                      value={formData.extractionSpecifique.complication}
                      onChange={(e) => updateNested("extractionSpecifique", "complication", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">— Sélectionner —</option>
                      <option>Aucune</option>
                      <option>Lacération muqueuse</option>
                      <option>Hémorragie</option>
                      <option>Perforation</option>
                    </select>
                  </label>
                </div>
              </section>
            )}

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">
                  {sNum.conclusion}. Conclusion
                </p>
              </div>
              <textarea
                value={formData.conclusion}
                onChange={(e) => updateField("conclusion", e.target.value)}
                placeholder="[à remplir]"
                rows={4}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm leading-relaxed focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </section>

            {!isRectosigmoidoscopie && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">
                    {sNum.recommandations}. Recommandations
                  </p>
                </div>
                <textarea
                  value={formData.recommandations}
                  onChange={(e) => updateField("recommandations", e.target.value)}
                  placeholder="[à remplir]"
                  rows={3}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm leading-relaxed focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </section>
            )}
          </fieldset>

        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 py-4 shadow-[0_-1px_10px_rgba(15,23,42,0.08)] backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className={
              hasExistingResult
                // Seule action de ce footer (consultation d'un compte rendu existant) :
                // reprend la place et le style bien visible du bouton Enregistrer retiré.
                ? "inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark"
                : "inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            }
          >
            Retour
          </button>
          {!hasExistingResult && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer le compte rendu"}
            </button>
          )}
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
