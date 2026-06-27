"use client";

import { useCompanyProfile } from "./companyProfile";
import { useQuotes } from "./quotes";
import { PLAN_LIMITS, type PlanId, type PlanLimits } from "./plans";

function sameMonth(iso: string, ref: Date): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export type PlanUsage = {
  plan: PlanId;
  limits: PlanLimits;
  used: { devis: number; factures: number };
  /** true si le quota de devis du mois est atteint. */
  devisReached: boolean;
  facturesReached: boolean;
  canUseAI: boolean;
  hasCoffreFort: boolean;
  hasDocumentsRH: boolean;
  setPlan: (plan: PlanId) => void;
};

/** Lit la formule courante et calcule l'usage du mois en cours. */
export function usePlan(): PlanUsage {
  const { profile, save } = useCompanyProfile();
  const { quotes } = useQuotes();
  const plan = profile.plan ?? "gratuit";
  const limits = PLAN_LIMITS[plan];

  const now = new Date();
  let devis = 0;
  let factures = 0;
  for (const q of quotes) {
    if (!sameMonth(q.createdAt, now)) continue;
    if (q.type === "facture") factures += 1;
    else devis += 1;
  }

  return {
    plan,
    limits,
    used: { devis, factures },
    devisReached: devis >= limits.devisParMois,
    facturesReached: factures >= limits.facturesParMois,
    canUseAI: limits.iaRequetes > 0,
    hasCoffreFort: limits.coffreFort,
    hasDocumentsRH: limits.documentsRH,
    setPlan: (next: PlanId) => save({ ...profile, plan: next }),
  };
}
