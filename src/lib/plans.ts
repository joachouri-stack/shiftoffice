/**
 * Plans tarifaires et limites associées (module PUR).
 * Source de vérité des quotas, partagée client/serveur.
 * Le paiement réel (Stripe) se branchera dessus au sprint final.
 */

export type PlanId = "gratuit" | "essentiel" | "pro";

export type PlanLimits = {
  devisParMois: number; // Infinity = illimité
  facturesParMois: number;
  iaRequetes: number; // 0 = pas d'IA
  documentsRH: boolean;
  coffreFort: boolean;
  utilisateurs: number;
};

export const PLAN_NAME: Record<PlanId, string> = {
  gratuit: "Gratuit",
  essentiel: "Essentiel",
  pro: "Pro",
};

export const PLAN_PRICE: Record<PlanId, number> = {
  gratuit: 0,
  essentiel: 29,
  pro: 59,
};

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  gratuit: {
    devisParMois: 3,
    facturesParMois: 3,
    iaRequetes: 0,
    documentsRH: false,
    coffreFort: false,
    utilisateurs: 1,
  },
  essentiel: {
    devisParMois: Infinity,
    facturesParMois: Infinity,
    iaRequetes: 50,
    documentsRH: false,
    coffreFort: false,
    utilisateurs: 1,
  },
  pro: {
    devisParMois: Infinity,
    facturesParMois: Infinity,
    iaRequetes: Infinity,
    documentsRH: true,
    coffreFort: true,
    utilisateurs: 3,
  },
};

export function planRank(plan: PlanId): number {
  return { gratuit: 0, essentiel: 1, pro: 2 }[plan];
}

/** Formatte une limite (∞ pour illimité). */
export function fmtLimit(n: number): string {
  return n === Infinity ? "illimité" : String(n);
}
