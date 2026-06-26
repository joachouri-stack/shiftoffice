import { Check, Flame } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Gratuit",
    price: "0",
    period: "/mois",
    desc: "Pour découvrir Shift Office.",
    features: [
      "1 devis par mois",
      "1 facture par mois",
      "1 document par mois",
      "1 demande IA par jour",
    ],
    cta: "Commencer gratuitement",
    highlighted: false,
  },
  {
    name: "Essentiel",
    price: "29",
    period: "/mois",
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
    cta: "Choisir Essentiel",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "59",
    period: "/mois",
    desc: "Toute la puissance de Shift Office.",
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
    cta: "Choisir Pro",
    highlighted: true,
  },
];

export function Pricing() {
  return (
    <Section id="abonnements">
      <SectionHeading
        eyebrow="Abonnements"
        title="Un prix simple, comme le reste"
        subtitle="Sans engagement, résiliable à tout moment. Commencez gratuitement, évoluez quand vous voulez."
      />

      <div className="mx-auto mt-14 grid max-w-5xl items-start gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "flex h-full flex-col p-7 sm:p-8",
              plan.highlighted &&
                "ring-brand/40 relative ring-2 shadow-[var(--shadow-pop)] lg:-translate-y-2"
            )}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-7">
                <Badge variant="brand">
                  <Flame size={12} />
                  Le plus populaire
                </Badge>
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
              {plan.features.map((feat, i) => {
                const isHeader = feat.endsWith(":");
                return (
                  <li
                    key={feat}
                    className={cn(
                      "flex items-start gap-2.5 text-sm",
                      isHeader && i === 0 && "text-muted font-medium"
                    )}
                  >
                    {!isHeader && (
                      <span className="bg-brand-50 text-brand mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                        <Check size={13} strokeWidth={3} />
                      </span>
                    )}
                    <span className={cn(!isHeader && "text-ink/90")}>
                      {feat}
                    </span>
                  </li>
                );
              })}
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
