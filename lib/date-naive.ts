/**
 * Les rendez-vous sont enregistrés « naïfs » : l'heure saisie est stockée telle quelle,
 * comme si c'était de l'UTC (toNaiveISO côté planification, parseDateTimeAsUtc côté
 * backend). Les relire en heure locale ajoutait le décalage du poste (9 h saisi
 * devenait 12 h ou 13 h) : toujours passer par ces fonctions.
 */

/** Options à ajouter à toLocale*String pour afficher l'heure saisie. */
export const FUSEAU_NAIF = { timeZone: "UTC" } as const;

/**
 * Jour « AAAA-MM-JJ » d'une date du calendrier (heure locale). Ne jamais utiliser
 * toISOString().split('T')[0] pour ça : une case du calendrier vaut minuit heure
 * locale, soit la veille en UTC à Madagascar — le rendez-vous du 8 s'affichait le 9.
 */
export function cleJour(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Date locale portant les mêmes jour et heure que ceux saisis (comparaisons avec new Date()). */
export function dateNaive(iso: string): Date {
  const d = new Date(iso);
  return new Date(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
  );
}
