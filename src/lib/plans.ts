/**
 * Plans tarifaires et limites associées (module PUR).
 * Modèle de lancement : 2 plans (Gratuit + Pro). Un plan Business arrivera plus tard.
 * Source de vérité des quotas, partagée client/serveur.
 */

export type PlanId = "gratuit" | "pro";

export type PlanLimits = {
  devisParMois: number; // Infinity = illimité
  facturesParMois: number;
  iaParJour: number; // demandes IA par jour (Infinity = illimité)
  envoiEmail: boolean; // envoi email professionnel
  whatsapp: boolean; // envoi WhatsApp Business
  utilisateurs: number;
};

export const PLAN_NAME: Record<PlanId, string> = {
  gratuit: "Gratuit",
  pro: "Pro",
};

export const PLAN_PRICE: Record<PlanId, number> = {
  gratuit: 0,
  pro: 29,
};

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  gratuit: {
    devisParMois: 3,
    facturesParMois: 3,
    iaParJour: 1,
    envoiEmail: false,
    whatsapp: false,
    utilisateurs: 1,
  },
  pro: {
    devisParMois: Infinity,
    facturesParMois: Infinity,
    iaParJour: Infinity,
    envoiEmail: true,
    whatsapp: true,
    utilisateurs: 1,
  },
};

/** Normalise un plan stocké (tolère les anciennes valeurs comme "essentiel"). */
export function normalizePlan(plan: string | undefined): PlanId {
  return plan === "pro" ? "pro" : "gratuit";
}

export function planRank(plan: PlanId): number {
  return plan === "pro" ? 1 : 0;
}

/** Formatte une limite (∞ pour illimité). */
export function fmtLimit(n: number): string {
  return n === Infinity ? "illimité" : String(n);
}
