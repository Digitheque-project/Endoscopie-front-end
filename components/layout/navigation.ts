export type NavLink = {
  href: string;
  icon: string;
  label: string;
  matchPrefix?: boolean;
};

export type HeaderMeta = {
  title: string;
  subtitle: string;
  icon: string;
};

export const MAIN_LINKS: NavLink[] = [
  { href: "/", icon: "dashboard", label: "Tableau de bord" },
  { href: "/prescriptions", icon: "medication", label: "Fil de prescription" },
  { href: "/agenda", icon: "calendar_month", label: "Agenda / Rendez-vous" },
  { href: "/rapport", icon: "description", label: "Rapport" },
  { href: "/archives", icon: "inventory_2", label: "Archives" },
];

export const HEADER_BY_PATH: Record<string, HeaderMeta> = {
  "/": {
    title: "endosystems_clinical",
    subtitle: "",
    icon: "dashboard",
  },
  "/prescriptions": {
    title: "Fil de prescription",
    subtitle: "Demandes et planification",
    icon: "medication",
  },
  "/agenda": {
    title: "Agenda / Rendez-vous",
    subtitle: "Planning des examens",
    icon: "calendar_month",
  },
  "/checklists": {
    title: "Check-lists",
    subtitle: "Suivi des etapes de preparation",
    icon: "checklist",
  },
  "/checklists/avant": {
    title: "Check-list avant",
    subtitle: "Phase 1 / Avant l'endoscopie",
    icon: "fact_check",
  },
  "/checklists/apres": {
    title: "Check-list apres",
    subtitle: "Phase 2 / Apres l'endoscopie",
    icon: "fact_check",
  },
  "/prescription-workflow": {
    title: "Opération Endoscopie",
    subtitle: "Transcription vocale et prescriptions intermédiaires",
    icon: "clinical_notes",
  },
  "/rapport": {
    title: "Rapport",
    subtitle: "Validation et consultation",
    icon: "description",
  },

  "/archives": {
    title: "Archives",
    subtitle: "Historique et dossiers",
    icon: "inventory_2",
  },
  "/patients": {
    title: "Liste des Patients",
    subtitle: "Programmation du jour",
    icon: "people",
  },
  "/patient-dossier": {
    title: "patient_dossier_interactif",
    subtitle: "",
    icon: "person",
  },
  "/planification-examens": {
    title: "Planification de l'examen",
    subtitle: "Organisation du parcours",
    icon: "event",
  },
  "/cpa": {
    title: "Demande CPA / image",
    subtitle: "Documents et images associés",
    icon: "assignment_add",
  },
  "/demande-cpa": {
    title: "Demande de CPA",
    subtitle: "",
    icon: "assignment_add",
  },
};

export const DEFAULT_HEADER: HeaderMeta = HEADER_BY_PATH["/"];
