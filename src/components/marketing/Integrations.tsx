import { CreditCard, Mail, Globe } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";

const INTEGRATIONS = [
  {
    icon: CreditCard,
    name: "Stripe",
    text: "Encaissez vos clients et gérez votre abonnement en toute sécurité.",
  },
  {
    icon: Globe,
    name: "Google",
    text: "Connexion en un clic avec votre compte Google. Simple et rapide.",
  },
  {
    icon: Mail,
    name: "Gmail",
    text: "Envoyez vos devis et factures directement, sans quitter Shift Office.",
  },
];

export function Integrations() {
  return (
    <Section id="integrations" className="bg-mist/60">
      <SectionHeading
        eyebrow="Intégrations"
        title="Connecté à vos outils"
        subtitle="Shift Office s'intègre aux services que vous utilisez déjà. D'autres intégrations arrivent."
      />

      <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
        {INTEGRATIONS.map((it) => (
          <Card key={it.name} interactive className="p-6 text-center">
            <div className="bg-paper border-line text-ink mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border shadow-[var(--shadow-soft)]">
              <it.icon size={24} />
            </div>
            <h3 className="text-ink mt-4 font-semibold">{it.name}</h3>
            <p className="text-muted mt-1.5 text-sm leading-relaxed">
              {it.text}
            </p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
