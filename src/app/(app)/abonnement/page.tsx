import type { Metadata } from "next";
import { Check, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/app/PageHeader";

export const metadata: Metadata = { title: "Abonnement" };

const ARTISAN_FEATURES = [
  "Assistant IA illimité",
  "Documents illimités",
  "Devis & factures professionnels",
  "Coffre-fort sécurisé",
  "Support prioritaire",
];

export default function AbonnementPage() {
  return (
    <>
      <PageHeader
        title="Abonnement"
        subtitle="Gérez votre formule et votre facturation."
      />

      {/* Formule actuelle */}
      <Card className="mb-6 p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-ink text-lg font-semibold">Formule Découverte</p>
              <Badge variant="neutral">Gratuit</Badge>
            </div>
            <p className="text-muted mt-1 text-sm">
              Vous utilisez actuellement la version gratuite.
            </p>
          </div>
          <Button href="#artisan">Passer à Artisan</Button>
        </div>
      </Card>

      {/* Upgrade */}
      <Card
        id="artisan"
        className="ring-brand/30 relative overflow-hidden p-6 ring-2 sm:p-8"
      >
        <div className="absolute -top-3 left-6 sm:left-8">
          <Badge variant="brand">
            <Sparkles size={12} />
            Recommandé
          </Badge>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-ink text-xl font-semibold tracking-tight">
              Artisan
            </h2>
            <p className="text-muted mt-1 text-sm">
              Tout pour gagner du temps au quotidien.
            </p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-ink text-4xl font-semibold tracking-tight tabular">
                29 €
              </span>
              <span className="text-muted text-sm">/mois</span>
            </div>
          </div>

          <ul className="space-y-2.5">
            {ARTISAN_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm">
                <span className="bg-brand-50 text-brand inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span className="text-ink/90">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button size="lg" className="mt-7 w-full sm:w-auto">
          Essayer 14 jours gratuitement
        </Button>
      </Card>
    </>
  );
}
