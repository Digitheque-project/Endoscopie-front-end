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
  { href: "/checklists", icon: "checklist", label: "Check-lists", matchPrefix: true },
  { href: "/rapport", icon: "description", label: "Rapport" },
  { href: "/archives", icon: "inventory_2", label: "Archives" },
];

export const CHECKLIST_LINKS: NavLink[] = [
  { href: "/checklists/avant", icon: "fact_check", label: "Check-list avant" },
  { href: "/checklists/apres", icon: "fact_check", label: "Check-list apres" },
];

export const HEADER_BY_PATH: Record<string, HeaderMeta> = {
  "/": {
    title: "Tableau de bord",
    subtitle: "Vue globale du service",
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
    title: "Dossier Patient",
    subtitle: "Synthèse clinique",
    icon: "person",
  },
  "/planification": {
    title: "Planification de l'examen",
    subtitle: "Organisation du parcours",
    icon: "event",
  },
  "/cpa": {
    title: "Demande CPA / image",
    subtitle: "Documents et images associés",
    icon: "assignment_add",
  },
};

export const DEFAULT_HEADER: HeaderMeta = HEADER_BY_PATH["/"];
