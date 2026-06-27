"use client";

import { useState } from "react";
import { Check, Flame, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type PlanId = "gratuit" | "essentiel" | "pro";

type Plan = {
  id: PlanId;
  name: string;
  price: number; // €/mois
  desc: string;
  features: string[];
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "gratuit",
    name: "Gratuit",
    price: 0,
    desc: "Pour découvrir Shift Office.",
    features: [
      "1 devis par mois",
      "1 facture par mois",
      "1 document par mois",
      "1 demande IA par jour",
    ],
  },
  {
    id: "essentiel",
    name: "Essentiel",
    price: 29,
    desc: "Pour gagner du temps au quotidien.",
    features: [
      "IA illimitée",
      "Devis illimités",
      "Factures illimitées",
      "Documents illimités",
      "Coffre-fort sécurisé",
      "Intégration Stripe",
      "Intégration Gmail",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 59,
    desc: "Toute la puissance de Shift Office.",
    featured: true,
    features: [
      "Tout Essentiel, plus :",
      "Fiches de paie",
      "Contrats",
      "Quittances",
      "Calcul de TVA & marges",
      "Graphiques & évolution",
      "Mémoire d'entreprise",
      "Assistant IA bâtiment",
    ],
  },
];

export function PricingPlans({
  variant = "marketing",
  current,
}: {
  variant?: "marketing" | "app";
  current?: PlanId;
}) {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      {/* Toggle facturation */}
      <div className="flex justify-center">
        <div className="border-line bg-paper inline-flex items-center gap-1 rounded-full border p-1 shadow-[var(--shadow-soft)]">
          {(
            [
              ["monthly", "Mensuel"],
              ["annual", "Annuel"],
            ] as const
          ).map(([key, label]) => {
            const active = (key === "annual") === annual;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setAnnual(key === "annual")}
                className={cn(
                  "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-ink text-paper" : "text-muted hover:text-ink"
                )}
              >
                {label}
                {key === "annual" && (
                  <span
                    className={cn(
                      "ml-1.5 rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold",
                      active ? "bg-brand text-paper" : "bg-brand-50 text-brand"
                    )}
                  >
                    −2 mois
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cartes */}
      <div className="mx-auto mt-10 grid max-w-5xl items-stretch gap-5 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            annual={annual}
            variant={variant}
            current={current}
          />
        ))}
      </div>
      <p className="text-muted mt-6 text-center text-sm">
        Sans engagement · Résiliable à tout moment · TVA non applicable, art.
        293 B du CGI
      </p>
    </div>
  );
}

function PlanCard({
  plan,
  annual,
  variant,
  current,
}: {
  plan: Plan;
  annual: boolean;
  variant: "marketing" | "app";
  current?: PlanId;
}) {
  const dark = !!plan.featured;
  const mid = !dark && plan.id === "essentiel";
  const isCurrent = current === plan.id;
  const monthly = annual ? Math.round((plan.price * 10) / 12) : plan.price;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-[1.75rem] border p-7 transition-all duration-300 hover:-translate-y-1 sm:p-8",
        dark &&
          "border-ink bg-ink text-paper shadow-[var(--shadow-pop)] lg:-translate-y-3",
        mid &&
          "border-brand/30 text-ink bg-gradient-to-b from-brand-50/60 to-paper shadow-[var(--shadow-pop)] ring-1 ring-brand/15",
        !dark &&
          !mid &&
          "border-line bg-paper text-ink shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-pop)]"
      )}
    >
      {dark && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[1.75rem]"
          style={{
            background:
              "radial-gradient(60% 40% at 50% 0%, rgba(255,107,43,0.25) 0%, transparent 70%)",
          }}
        />
      )}

      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center justify-between">
          <h3 className={cn("text-lg font-semibold", dark && "text-paper")}>
            {plan.name}
          </h3>
          {plan.featured && !isCurrent && (
            <span className="bg-brand text-paper inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">
              <Flame size={12} />
              Populaire
            </span>
          )}
          {mid && !isCurrent && (
            <span className="bg-brand text-paper inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-[var(--shadow-brand)]">
              <Star size={12} />
              Recommandé
            </span>
          )}
          {isCurrent && (
            <span className="bg-brand-50 text-brand inline-flex rounded-full px-2.5 py-1 text-xs font-semibold">
              Formule actuelle
            </span>
          )}
        </div>

        <p className={cn("mt-1 text-sm", dark ? "text-white/60" : "text-muted")}>
          {plan.desc}
        </p>

        <div className="mt-5 flex items-baseline gap-1">
          <span
            className={cn(
              "text-4xl font-semibold tracking-tight tabular",
              dark && "text-paper"
            )}
          >
            {monthly}€
          </span>
          <span className={cn("text-sm", dark ? "text-white/60" : "text-muted")}>
            /mois
          </span>
        </div>
        <p
          className={cn(
            "mt-1 h-4 text-xs",
            dark ? "text-white/50" : "text-muted"
          )}
        >
          {annual && plan.price > 0
            ? `soit ${plan.price * 10} € facturés par an`
            : ""}
        </p>

        <ul className="mt-6 flex-1 space-y-3">
          {plan.features.map((feat) => {
            const header = feat.endsWith(":");
            if (header) {
              return (
                <li
                  key={feat}
                  className={cn(
                    "text-sm font-medium",
                    dark ? "text-white/80" : "text-muted"
                  )}
                >
                  {feat}
                </li>
              );
            }
            return (
              <li key={feat} className="flex items-start gap-2.5 text-sm">
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                    dark || mid ? "bg-brand text-paper" : "bg-brand-50 text-brand"
                  )}
                >
                  <Check size={13} strokeWidth={3} />
                </span>
                <span className={dark ? "text-white/90" : "text-ink/90"}>
                  {feat}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-8">
          {variant === "app" ? (
            <Button
              variant={isCurrent ? "outline" : dark || mid ? "primary" : "outline"}
              size="lg"
              className="w-full"
              disabled={isCurrent}
            >
              {isCurrent
                ? "Votre formule"
                : plan.price === 0
                  ? "Revenir au gratuit"
                  : `Passer à ${plan.name}`}
            </Button>
          ) : (
            <Button
              href="/inscription"
              variant={dark || mid ? "primary" : "outline"}
              size="lg"
              className="w-full"
            >
              {plan.price === 0
                ? "Commencer gratuitement"
                : `Choisir ${plan.name}`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
