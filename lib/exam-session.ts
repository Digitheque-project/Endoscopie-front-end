import { apiJson } from "./api";

export type SessionExam = {
  id: string;
  patientId: string;
  typeExamen: string;
  hasOperation: boolean;
  hasResultat: boolean;
};

export type SessionInfo = {
  sameSlot: boolean;
  exams: SessionExam[];
};

/**
 * Détecte si cette prescription fait partie d'une session groupée (plusieurs examens
 * du même patient planifiés sur EXACTEMENT le même créneau — voir
 * AppService.getSameSlotSiblings côté backend). Utilisé pour enchaîner la dictée
 * vocale et le compte-rendu procédure par procédure au sein d'une même séance.
 */
export async function fetchSessionSiblings(prescriptionId: string): Promise<SessionInfo> {
  return apiJson<SessionInfo>(`/api/prescriptions/${encodeURIComponent(prescriptionId)}/session`);
}

/** Premier examen de la session qui n'a pas encore sa dictée vocale (opération) enregistrée, hors celui-ci. */
export function nextExamWithoutOperation(session: SessionInfo, currentId: string): SessionExam | null {
  return session.exams.find((e) => e.id !== currentId && !e.hasOperation) ?? null;
}

/** Premier examen de la session qui n'a pas encore son compte-rendu enregistré, hors celui-ci. */
export function nextExamWithoutResultat(session: SessionInfo, currentId: string): SessionExam | null {
  return session.exams.find((e) => e.id !== currentId && !e.hasResultat) ?? null;
}
