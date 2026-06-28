"use client";

import { useState } from "react";
import { Check, Flame } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type { PlanId } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

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
      "3 devis par mois",
      "3 factures par mois",
      "1 demande IA par jour",
      "Téléchargement PDF",
      "1 utilisateur",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    desc: "Toute la puissance de Shift Office.",
    featured: true,
    features: [
      "Devis illimités",
      "Factures illimitées",
      "Assistant IA bâtiment",
      "Téléchargement PDF",
      "Envoi email professionnel",
      "Envoi WhatsApp Business",
      "1 utilisateur",
    ],
  },
];

export function PricingPlans({
  variant = "marketing",
  surface = "light",
  current,
  onSelect,
}: {
  variant?: "marketing" | "app";
  surface?: "light" | "dark";
  current?: PlanId;
  onSelect?: (id: PlanId) => void;
}) {
  const [annual, setAnnual] = useState(false);
  const onDark = surface === "dark";

  return (
    <div>
      {/* Toggle facturation */}
      <div className="flex justify-center">
        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-full border p-1",
            onDark
              ? "border-white/10 bg-white/5 backdrop-blur"
              : "border-line bg-paper shadow-[var(--shadow-soft)]"
          )}
        >
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
                  active
                    ? onDark
                      ? "bg-paper text-ink"
                      : "bg-ink text-paper"
                    : onDark
                      ? "text-white/60 hover:text-paper"
                      : "text-muted hover:text-ink"
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
      <div className="mx-auto mt-10 grid max-w-3xl items-stretch gap-5 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            annual={annual}
            variant={variant}
            surface={surface}
            current={current}
            onSelect={onSelect}
          />
        ))}
      </div>
      <p
        className={cn(
          "mt-6 text-center text-sm",
          onDark ? "text-white/50" : "text-muted"
        )}
      >
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
  surface,
  current,
  onSelect,
}: {
  plan: Plan;
  annual: boolean;
  variant: "marketing" | "app";
  surface: "light" | "dark";
  current?: PlanId;
  onSelect?: (id: PlanId) => void;
}) {
  const onDark = surface === "dark";
  const featured = !!plan.featured; // Pro
  const base = !featured; // Gratuit
  const highlight = featured;
  const isCurrent = current === plan.id;
  const monthly = annual ? Math.round((plan.price * 10) / 12) : plan.price;

  // Texte clair quand la carte a un fond sombre/translucide.
  const invert = onDark || featured;
  const showGlow = featured;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-[1.75rem] border p-7 transition-all duration-300 hover:-translate-y-1 sm:p-8",
        onDark
          ? cn(
              featured &&
                "border-brand/50 bg-gradient-to-b from-brand/20 to-white/[0.03] text-paper shadow-[var(--shadow-pop)] ring-1 ring-brand/25 lg:-translate-y-2",
              base && "border-white/10 bg-white/[0.035] text-paper"
            )
          : cn(
              featured &&
                "border-ink bg-ink text-paper shadow-[var(--shadow-pop)] lg:-translate-y-2",
              base &&
                "border-line bg-paper text-ink shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-pop)]"
            )
      )}
    >
      {showGlow && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[1.75rem]"
          style={{
            background: featured
              ? "radial-gradient(65% 45% at 50% 0%, rgba(255,107,43,0.35) 0%, transparent 70%)"
              : "radial-gradient(60% 40% at 50% 0%, rgba(255,107,43,0.18) 0%, transparent 70%)",
          }}
        />
      )}

      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center justify-between">
          <h3 className={cn("text-lg font-semibold", invert && "text-paper")}>
            {plan.name}
          </h3>
          {featured && !isCurrent && (
            <span className="bg-brand text-paper inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-[var(--shadow-brand)]">
              <Flame size={12} />
              Populaire
            </span>
          )}
          {isCurrent && (
            <span className="bg-brand-50 text-brand inline-flex rounded-full px-2.5 py-1 text-xs font-semibold">
              Formule actuelle
            </span>
          )}
        </div>

        <p className={cn("mt-1 text-sm", invert ? "text-white/60" : "text-muted")}>
          {plan.desc}
        </p>

        <div className="mt-5 flex items-baseline gap-1">
          <span
            className={cn(
              "text-4xl font-semibold tracking-tight tabular",
              invert && "text-paper"
            )}
          >
            {monthly}€
          </span>
          <span className={cn("text-sm", invert ? "text-white/60" : "text-muted")}>
            /mois
          </span>
        </div>
        <p
          className={cn(
            "mt-1 h-4 text-xs",
            invert ? "text-white/50" : "text-muted"
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
                    invert ? "text-white/80" : "text-muted"
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
                    highlight || onDark
                      ? "bg-brand text-paper"
                      : "bg-brand-50 text-brand"
                  )}
                >
                  <Check size={13} strokeWidth={3} />
                </span>
                <span className={invert ? "text-white/90" : "text-ink/90"}>
                  {feat}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-8">
          {variant === "app" ? (
            <Button
              variant={isCurrent ? "outline" : highlight ? "primary" : "outline"}
              size="lg"
              className="w-full"
              disabled={isCurrent}
              onClick={() => onSelect?.(plan.id)}
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
              variant={highlight ? "primary" : onDark ? "secondary" : "outline"}
              size="lg"
              className={cn(
                "w-full",
                base && onDark && "bg-white/10 text-paper hover:bg-white/20"
              )}
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
