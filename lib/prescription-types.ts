export type StatutPrescription =
  | 'EN_ATTENTE'
  | 'CONFIRME'
  | 'EN_COURS'
  | 'TERMINE'
  | 'ANNULE';

export type DegreeUrgence =
  | 'Électif'
  | 'Urgent'
  | 'Semi-urgent'
  | 'Très urgent';

export type TypeAnesthesie =
  | 'anesthesie_locale'
  | 'anesthesie_generale';

export type GenrePatient =
  | 'Masculin'
  | 'Féminin';

// ─── Patient ───────────────────────────────────────────────────────────────

export interface Patient {
  nom: string;
  prenoms: string;
  dateNaissance: string;
  age: number;
  genre: GenrePatient;
}

// ─── Détails de la prescription ────────────────────────────────────────────

export interface DetailsPrescription {
  numeroPrescription: string;
  datePrescription: string;
  prescripteur: string;
  patient: Patient;
  typeExamen: string;
  degreeUrgence: DegreeUrgence;
  indicationClinique: string;
  serviceDemandeur: string;
  observations?: string;
  statut: StatutPrescription;
}

// ─── Rendez-vous confirmé ──────────────────────────────────────────────────

export interface RendezVousConfirme {
  date: string;
  heure: string;
  salle: string;
  hopital: string;
  operateurAssigne: string;
  dureeEstimee: string;
  instructionsPatient: string;
  confirmeParAdmin: boolean;
  confirmeParAdminLe?: string;
}

// ─── Type d'anesthésie ─────────────────────────────────────────────────────

export interface TypeAnesthesieInfo {
  type: TypeAnesthesie;
  description: string;
  medecinAnesthesisteRequis: boolean;
  remarque?: string;
}

export const TYPES_ANESTHESIE: TypeAnesthesieInfo[] = [
  {
    type: 'anesthesie_locale',
    description: 'Spray lidocaïne / gel',
    medecinAnesthesisteRequis: false,
    remarque:
      'Spray ou gel anesthésiant appliqué localement. Médecin anesthésiste non requis.',
  },
  {
    type: 'anesthesie_generale',
    description: 'Sédation IV — médecin anesthésiste requis',
    medecinAnesthesisteRequis: true,
    remarque:
      'Présence obligatoire du médecin anesthésiste. Vérifier la disponibilité avant validation.',
  },
];

// ─── Interface complète de confirmation ───────────────────────────────────

export interface ConfirmationPlanification {
  detailsPrescription: DetailsPrescription;
  rendezVous: RendezVousConfirme;
  typeAnesthesie: TypeAnesthesie | null;
}

// ─── Navigation (emplacement de l'interface) ───────────────────────────────

export interface EtapeNavigation {
  id: string;
  label: string;
  route: string;
  actif: boolean;
}

export const ETAPES_NAVIGATION: EtapeNavigation[] = [
  {
    id: 'file-prescription',
    label: 'File de prescription',
    route: '/prescription/file',
    actif: false,
  },
  {
    id: 'confirmation-planification',
    label: 'Confirmation & planification',
    route: '/prescription/confirmation',
    actif: true,
  },
  {
    id: 'checklist-endoscopie',
    label: 'Check-list avant endoscopie',
    route: '/prescription/checklist',
    actif: false,
  },
];
