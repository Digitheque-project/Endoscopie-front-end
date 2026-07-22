/**
 * Couleur associée à chaque type d'examen, pour un repérage visuel rapide dans le
 * Fil de prescription et les notifications (ex. Coloscopie en rose, Fibroscopie en
 * bleu, Rectosigmoïdoscopie en violet...). Correspondance par mot-clé (insensible à
 * la casse et aux accents) plutôt que par égalité stricte, car le libellé exact peut
 * légèrement varier selon la source (ex. "Fibroscopie digestive haute (FOGD)").
 */
function normalize(value: string): string {
  const combiningMarksStart = String.fromCharCode(0x0300);
  const combiningMarksEnd = String.fromCharCode(0x036f);
  const diacriticsRegex = new RegExp("[" + combiningMarksStart + "-" + combiningMarksEnd + "]", "g");
  return value.normalize("NFD").replace(diacriticsRegex, "").toLowerCase();
}

const EXAM_TYPE_RULES: { keyword: string; className: string }[] = [
  { keyword: "coloscopie", className: "bg-pink-100 text-pink-700" },
  { keyword: "fibroscopie", className: "bg-blue-100 text-blue-700" },
  { keyword: "rectosigmoidoscopie", className: "bg-violet-100 text-violet-700" },
  { keyword: "recto-sigmoidoscopie", className: "bg-violet-100 text-violet-700" },
  { keyword: "recto sigmoidoscopie", className: "bg-violet-100 text-violet-700" },
  { keyword: "dilatation", className: "bg-orange-100 text-orange-700" },
  { keyword: "ligature", className: "bg-teal-100 text-teal-700" },
  { keyword: "injection", className: "bg-amber-100 text-amber-700" },
  { keyword: "gastrostomie", className: "bg-indigo-100 text-indigo-700" },
  { keyword: "gpe", className: "bg-indigo-100 text-indigo-700" },
  { keyword: "enteroscopie", className: "bg-cyan-100 text-cyan-700" },
  { keyword: "cholangio", className: "bg-fuchsia-100 text-fuchsia-700" },
  { keyword: "cpre", className: "bg-fuchsia-100 text-fuchsia-700" },
];

const DEFAULT_EXAM_TYPE_CLASS = "bg-secondary-container text-secondary";

export function getExamTypeBadgeClass(typeExamen: string): string {
  const normalized = normalize(typeExamen);
  const match = EXAM_TYPE_RULES.find((rule) => normalized.includes(rule.keyword));
  return match?.className ?? DEFAULT_EXAM_TYPE_CLASS;
}
