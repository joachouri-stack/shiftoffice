/**
 * Calculs liés à la lettre de licenciement (module pur, sans dépendance).
 * Réutilisé côté formulaire (affichage + validation) et côté PDF (source de
 * vérité). Toutes les dates sont au format français « jj/mm/aaaa ».
 */

export type TypeLicenciement =
  | "cause-reelle"
  | "faute-grave"
  | "faute-lourde"
  | "economique";

export const LIBELLE_TYPE: Record<TypeLicenciement, string> = {
  "cause-reelle": "cause réelle et sérieuse",
  "faute-grave": "faute grave",
  "faute-lourde": "faute lourde",
  economique: "motif économique",
};

const SANS_INDEMNITE: TypeLicenciement[] = ["faute-grave", "faute-lourde"];

/** Parse une date « jj/mm/aaaa » en objet Date (ou null si invalide). */
export function parseFr(s: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((s || "").trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (
    d.getFullYear() !== Number(yyyy) ||
    d.getMonth() !== Number(mm) - 1 ||
    d.getDate() !== Number(dd)
  )
    return null;
  return d;
}

function formatFr(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export type Anciennete = { annees: number; mois: number; totalMois: number };

/** Ancienneté entre l'embauche et une date de référence (par défaut aujourd'hui). */
export function calculerAnciennete(
  dateEmbauche: string,
  ref: Date = new Date()
): Anciennete {
  const e = parseFr(dateEmbauche);
  if (!e) return { annees: 0, mois: 0, totalMois: 0 };
  let total = (ref.getFullYear() - e.getFullYear()) * 12 + (ref.getMonth() - e.getMonth());
  if (ref.getDate() < e.getDate()) total -= 1; // mois non révolu
  total = Math.max(0, total);
  return { annees: Math.floor(total / 12), mois: total % 12, totalMois: total };
}

/** Durée de préavis selon l'ancienneté et le type (Code du travail). */
export function calculerPreavis(anc: Anciennete, type: TypeLicenciement): string {
  if (SANS_INDEMNITE.includes(type)) return "Aucun préavis (faute grave ou lourde)";
  if (anc.totalMois < 6) return "Selon la convention collective";
  if (anc.totalMois < 24) return "1 mois";
  return "2 mois";
}

export type IndemniteResult = {
  eligible: boolean;
  indemnite: number;
  motif: string;
};

/**
 * Indemnité légale de licenciement 2026.
 * - Aucune indemnité en cas de faute grave/lourde.
 * - Ancienneté minimale de 8 mois requise.
 * - 1/4 de mois de salaire par année jusqu'à 10 ans, 1/3 au-delà (au prorata).
 */
export function calculerIndemnite(
  dateEmbauche: string,
  salaireBrut: number,
  type: TypeLicenciement,
  ref: Date = new Date()
): IndemniteResult {
  if (SANS_INDEMNITE.includes(type))
    return { eligible: false, indemnite: 0, motif: "Aucune indemnité (faute grave ou lourde)" };

  const anc = calculerAnciennete(dateEmbauche, ref);
  if (anc.totalMois < 8)
    return { eligible: false, indemnite: 0, motif: "Ancienneté inférieure à 8 mois" };

  const annees = anc.totalMois / 12; // au prorata
  const inf10 = Math.min(annees, 10);
  const sup10 = Math.max(0, annees - 10);
  const indemnite = (salaireBrut / 4) * inf10 + (salaireBrut / 3) * sup10;
  return { eligible: true, indemnite: Math.round(indemnite * 100) / 100, motif: "Indemnité légale" };
}

/** Nombre de jours ouvrables (hors dimanches) strictement après d1 jusqu'à d2 inclus. */
export function joursOuvrablesEntre(dateA: string, dateB: string): number | null {
  const a = parseFr(dateA);
  const b = parseFr(dateB);
  if (!a || !b) return null;
  if (b <= a) return 0;
  let count = 0;
  const cur = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  cur.setDate(cur.getDate() + 1);
  while (cur <= b) {
    if (cur.getDay() !== 0) count += 1; // exclut les dimanches
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/** Ajoute n jours ouvrables (hors dimanches) à une date et la renvoie formatée. */
export function ajouterJoursOuvrables(dateFr: string, n: number): string | null {
  const d = parseFr(dateFr);
  if (!d) return null;
  const cur = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  let added = 0;
  while (added < n) {
    cur.setDate(cur.getDate() + 1);
    if (cur.getDay() !== 0) added += 1;
  }
  return formatFr(cur);
}

export type Alerte = { level: "error" | "warn"; message: string };

/**
 * Vérifie que la lettre est envoyée au moins 2 jours ouvrables après
 * l'entretien préalable. Renvoie une alerte bloquante (error) si ce n'est pas
 * le cas — une lettre avec un délai illégal ne doit jamais être générée.
 */
export function verifierDelaisLegaux(
  dateEntretien: string,
  dateEnvoi: string
): { ok: boolean; alertes: Alerte[] } {
  const jo = joursOuvrablesEntre(dateEntretien, dateEnvoi);
  if (jo === null) return { ok: true, alertes: [] }; // dates incomplètes : pas de blocage
  if (jo < 2) {
    const minimum = ajouterJoursOuvrables(dateEntretien, 2);
    return {
      ok: false,
      alertes: [
        {
          level: "error",
          message: `La lettre doit être envoyée au minimum 2 jours ouvrables après l'entretien préalable du ${dateEntretien}.${minimum ? ` Date d'envoi possible à partir du ${minimum}.` : ""}`,
        },
      ],
    };
  }
  return { ok: true, alertes: [] };
}
