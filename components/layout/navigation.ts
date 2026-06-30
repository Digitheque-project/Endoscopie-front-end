export type NavLink = {
  href: string;
  icon: string;
  label: string;
  matchPrefix?: boolean;
  /** Si défini, le lien n'est visible que pour ces rôles (voir contexts/AuthContext.tsx). Omis = visible par tous. */
  roles?: Array<"MAJOR" | "MEDECIN">;
};

export type HeaderMeta = {
  title: string;
  subtitle: string;
  icon: string;
};

export const MAIN_LINKS: NavLink[] = [
  { href: "/", icon: "dashboard", label: "Tableau de bord" },
  { href: "/prescriptions", icon: "medication", label: "Fil de prescription" },
  { href: "/agenda-rendez-vous", icon: "calendar_month", label: "Agenda / Rendez-vous" },
  { href: "/comptes-rendus-en-attente", icon: "edit_note", label: "Comptes rendus", roles: ["MEDECIN"] },
  { href: "/rapport", icon: "description", label: "Rapport" },
  { href: "/archives", icon: "inventory_2", label: "Archives" },
];

export const HEADER_BY_PATH: Record<string, HeaderMeta> = {
  "/": {
    title: "Endoscopie Clinique",
    subtitle: "",
    icon: "dashboard",
  },
  "/prescriptions": {
    title: "Fil de prescription",
    subtitle: "Demandes et planification",
    icon: "medication",
  },
  "/agenda-rendez-vous": {
    title: "Agenda / Rendez-vous",
    subtitle: "Programme des examens",
    icon: "calendar_month",
  },
  "/checklists": {
    title: "Listes de contrôle",
    subtitle: "Suivi des étapes de préparation",
    icon: "checklist",
  },
  "/checklists/avant": {
    title: "Liste de contrôle avant",
    subtitle: "Phase 1 / Avant l'endoscopie",
    icon: "fact_check",
  },
  "/checklists/apres": {
    title: "Liste de contrôle après",
    subtitle: "Phase 2 / Après l'endoscopie",
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
    title: "Dossier patient interactif",
    subtitle: "",
    icon: "person",
  },
  "/planification-examens": {
    title: "Planification de l'examen",
    subtitle: "Organisation du parcours",
    icon: "event",
  },
  "/demande-cpa": {
    title: "Demande de CPA",
    subtitle: "",
    icon: "assignment_add",
  },
  "/decisions-anesthesie": {
    title: "Anesthésie à décider",
    subtitle: "Rendez-vous en attente d'une décision médicale",
    icon: "vaccines",
  },
  "/comptes-rendus-en-attente": {
    title: "Comptes rendus en attente",
    subtitle: "Examens terminés, en attente de rédaction",
    icon: "edit_note",
  },
};

export const DEFAULT_HEADER: HeaderMeta = HEADER_BY_PATH["/"];
