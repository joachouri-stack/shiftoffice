"use client";

import { Sparkles, FileText, Receipt, Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/app/PageHeader";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { useToast } from "@/components/ui/Toast";
import { usePlan } from "@/lib/usePlan";
import { PLAN_NAME, fmtLimit, type PlanId } from "@/lib/plans";

export default function AbonnementPage() {
  const { plan, limits, used, setPlan } = usePlan();
  const toast = useToast();

  function onSelect(next: PlanId) {
    if (next === plan) return;
    setPlan(next);
    toast(`Formule ${PLAN_NAME[next]} activée`);
  }

  const usageRows = [
    {
      icon: FileText,
      label: "Devis ce mois",
      used: used.devis,
      max: limits.devisParMois,
    },
    {
      icon: Receipt,
      label: "Factures ce mois",
      used: used.factures,
      max: limits.facturesParMois,
    },
    {
      icon: Sparkles,
      label: "Assistant IA",
      used: 0,
      max: limits.iaParJour,
      isAI: true,
    },
  ];

  return (
    <>
      <PageHeader
        title="Abonnement"
        subtitle="Choisissez la formule qui vous correspond. Sans engagement."
      />

      {/* Usage du mois */}
      <Card className="mb-6 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted text-xs font-semibold uppercase tracking-tight">
              Formule actuelle
            </p>
            <p className="text-ink mt-0.5 text-lg font-semibold tracking-tight">
              {PLAN_NAME[plan]}
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {usageRows.map((r) => {
            const unlimited = r.max === Infinity;
            const pct = unlimited
              ? 0
              : Math.min(100, Math.round((r.used / Math.max(1, r.max)) * 100));
            return (
              <div key={r.label}>
                <div className="mb-1.5 flex items-center gap-2">
                  <r.icon size={15} className="text-brand" />
                  <span className="text-ink text-sm font-medium">{r.label}</span>
                </div>
                <p className="text-ink text-sm tabular">
                  {unlimited ? (
                    <span className="text-muted">Illimité</span>
                  ) : r.isAI ? (
                    <span className="text-muted">{r.max} / jour</span>
                  ) : (
                    <>
                      <span className="text-ink font-semibold">{r.used}</span>
                      <span className="text-muted"> / {fmtLimit(r.max)}</span>
                    </>
                  )}
                </p>
                {!unlimited && !r.isAI && (
                  <div className="bg-mist mt-1.5 h-1.5 overflow-hidden rounded-full">
                    <div
                      className="bg-brand h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <PricingPlans variant="app" current={plan} onSelect={onSelect} />

      <p className="text-muted mt-6 text-center text-sm">
        Un plan <span className="text-ink font-medium">Business</span> avec
        fonctionnalités avancées arrive bientôt.
      </p>

      <div className="text-muted mt-4 flex items-start justify-center gap-2 text-xs">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>
          Le paiement sécurisé (Stripe) sera activé prochainement. Pour
          l&apos;instant, le changement de formule est immédiat pour vous
          permettre de tester les fonctionnalités.
        </span>
      </div>
    </>
  );
}
