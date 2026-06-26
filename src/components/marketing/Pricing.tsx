import { Check } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Découverte",
    price: "0",
    period: "/mois",
    desc: "Pour tester Shift Office sans engagement.",
    features: [
      "Assistant IA (usage limité)",
      "Jusqu'à 5 documents",
      "Devis & factures basiques",
      "Support par e-mail",
    ],
    cta: "Commencer gratuitement",
    highlighted: false,
  },
  {
    name: "Artisan",
    price: "29",
    period: "/mois",
    desc: "Tout ce qu'il faut pour gagner du temps au quotidien.",
    features: [
      "Assistant IA illimité",
      "Documents illimités",
      "Devis & factures professionnels",
      "Coffre-fort sécurisé",
      "Support prioritaire",
    ],
    cta: "Essayer 14 jours",
    highlighted: true,
  },
];

export function Pricing() {
  return (
    <Section id="tarifs" className="bg-mist/60">
      <SectionHeading
        eyebrow="Tarifs"
        title="Un prix simple, comme le reste"
        subtitle="Sans engagement. Résiliable à tout moment. Pensé pour les artisans, pas pour les comptables."
      />

      <div className="mx-auto mt-14 grid max-w-3xl gap-6 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "flex flex-col p-7 sm:p-8",
              plan.highlighted &&
                "ring-brand/30 relative ring-2 shadow-[var(--shadow-pop)]"
            )}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-7">
                <Badge variant="brand">Le plus populaire</Badge>
              </div>
            )}
            <h3 className="text-ink text-lg font-semibold">{plan.name}</h3>
            <p className="text-muted mt-1 text-sm">{plan.desc}</p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-ink text-4xl font-semibold tracking-tight tabular">
                {plan.price}€
              </span>
              <span className="text-muted text-sm">{plan.period}</span>
            </div>

            <ul className="mt-6 flex-1 space-y-3">
              {plan.features.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5 text-sm">
                  <span className="bg-brand-50 text-brand mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                    <Check size={13} strokeWidth={3} />
                  </span>
                  <span className="text-ink/90">{feat}</span>
                </li>
              ))}
            </ul>

            <Button
              href="/inscription"
              variant={plan.highlighted ? "primary" : "outline"}
              size="lg"
              className="mt-8 w-full"
            >
              {plan.cta}
            </Button>
          </Card>
        ))}
      </div>
    </Section>
  );
}
