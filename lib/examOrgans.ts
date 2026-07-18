// Source commune pour la liste des organes examinés par type d'examen — utilisée à la
// fois par le compte rendu (résultats par organe) et par l'opération endoscopie
// (dictée vocale guidée organe par organe), pour qu'elles restent toujours alignées.

export type TypeExamen =
  | 'fibroscopie'
  | 'coloscopie'
  | 'rectosigmoidoscopie'
  | 'ligature_varices'
  | 'injection_colle'
  | 'dilatation_oesophagienne'
  | 'extraction_corps_etranger';

export interface Constatations {
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

export type ConstatationField = { label: string; key: keyof Constatations };

const VALID_TYPE_EXAMEN = new Set<string>([
  "fibroscopie", "coloscopie", "rectosigmoidoscopie",
  "ligature_varices", "injection_colle", "dilatation_oesophagienne", "extraction_corps_etranger",
]);

const procedureTypeMap: Record<string, TypeExamen> = {
  "fibroscopie digestive haute": "fibroscopie",
  "fibroscopie oeso-gastro-duodénale": "fibroscopie",
  "fibroscopie oeso-gastro-duodenale": "fibroscopie",
  "oesogastroduodenoscopie": "fibroscopie",
  "oeso-gastro-duodenoscopie": "fibroscopie",
  "gastroscopie": "fibroscopie",
  "endoscopie digestive haute": "fibroscopie",
  "coloscopie": "coloscopie",
  "coloscopie totale": "coloscopie",
  "colonoscopie": "coloscopie",
  "rectosigmoïdoscopie": "rectosigmoidoscopie",
  "rectosigmoidoscopie": "rectosigmoidoscopie",
  "ligature de varices oesophagiennes": "ligature_varices",
  "ligature de varices œsophagiennes": "ligature_varices",
  "injection de colle biologique": "injection_colle",
  "dilatation oesophagienne": "dilatation_oesophagienne",
  "extraction de corps étranger": "extraction_corps_etranger",
  "extraction de corps etranger": "extraction_corps_etranger",
};

export function mapProcedureToExamType(procedure?: string): TypeExamen | null {
  if (!procedure) return null;
  const normalized = procedure.trim().toLowerCase();
  // Valeurs enum directes stockées en base (ex: "fibroscopie", "ligature_varices")
  if (VALID_TYPE_EXAMEN.has(normalized)) return normalized as TypeExamen;
  if (procedureTypeMap[normalized]) return procedureTypeMap[normalized];

  // Les prescriptions réelles orthographient parfois le même examen différemment
  // (ex. "Recto-sigmoïdoscopie", "Recto sigmoïdoscopie", "Rectosigmoïdoscopie") — on
  // retire tirets/espaces/apostrophes avant de chercher les mots-clés pour tolérer
  // ces variantes plutôt que de rater la détection du type d'examen.
  const flattened = normalized.replace(/[\s'-]/g, '');
  if (flattened.includes("fibroscopie") || flattened.includes("gastroscopie") || flattened.includes("ogd")) return "fibroscopie";
  if (flattened.includes("colonoscopie") || flattened.includes("coloscopie")) return "coloscopie";
  if (flattened.includes("rectosigmo")) return "rectosigmoidoscopie";
  if (flattened.includes("ligature")) return "ligature_varices";
  if (flattened.includes("colle")) return "injection_colle";
  if (flattened.includes("dilatation")) return "dilatation_oesophagienne";
  if (flattened.includes("extraction")) return "extraction_corps_etranger";
  return null;
}

// Champs de constatations par famille d'examen
export const CONSTATATIONS_HAUTE: ConstatationField[] = [
  { label: 'Oesophage', key: 'oesophage' },
  { label: 'Cardia', key: 'cardia' },
  { label: 'Estomac', key: 'estomac' },
  { label: 'Pylore', key: 'pylore' },
  { label: 'Duodénum', key: 'duodenum' },
];

export const CONSTATATIONS_COLOSCOPIE: ConstatationField[] = [
  { label: 'Toucher rectal', key: 'toucherRectal' },
  { label: 'Anus', key: 'anus' },
  { label: 'Rectum', key: 'rectum' },
  { label: 'Colon', key: 'colon' },
  { label: 'Caecum', key: 'caecum' },
  { label: 'Valvule iléo-caecale', key: 'valvuleIleoCaecaie' },
  { label: 'Iléon terminal', key: 'ileonTerminal' },
];

export const CONSTATATIONS_RECTOSIGMOIDOSCOPIE: ConstatationField[] = [
  { label: 'Anus', key: 'anus' },
  { label: 'Rectum', key: 'rectum' },
  { label: 'Sigmoïde', key: 'sigmoid' },
];

export function getConstatationsFields(typeExamen: TypeExamen): ConstatationField[] {
  if (typeExamen === 'coloscopie') return CONSTATATIONS_COLOSCOPIE;
  if (typeExamen === 'rectosigmoidoscopie') return CONSTATATIONS_RECTOSIGMOIDOSCOPIE;
  return CONSTATATIONS_HAUTE;
}
