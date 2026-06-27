import { CreditCard, MessageCircle, HardDrive } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";

const INTEGRATIONS = [
  {
    icon: MessageCircle,
    name: "WhatsApp",
    text: "Envoyez vos devis et factures à vos clients, directement sur WhatsApp.",
  },
  {
    icon: HardDrive,
    name: "Google Drive",
    text: "Sauvegarde automatique de tous vos PDF, bien rangés par dossier.",
  },
  {
    icon: CreditCard,
    name: "Stripe",
    text: "Encaissez vos clients et gérez votre abonnement en toute sécurité.",
  },
];

export function Integrations() {
  return (
    <Section id="integrations">
      <SectionHeading
        eyebrow="Intégrations"
        title="Connecté à vos outils"
        subtitle="Shift Office se connecte à vos outils du quotidien. De nouvelles intégrations arrivent régulièrement."
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
