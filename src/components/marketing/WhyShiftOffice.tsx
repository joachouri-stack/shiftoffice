import { Clock, Smile, ShieldCheck, Gauge } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";

const REASONS = [
  {
    icon: Clock,
    title: "Des heures gagnées",
    text: "Ce qui vous prenait une soirée se fait en quelques secondes. L'IA s'occupe de la paperasse, vous restez sur le terrain.",
  },
  {
    icon: Smile,
    title: "Simple comme un SMS",
    text: "Aucune formation, aucun manuel. Si vous savez écrire un message, vous savez utiliser Shift Office.",
  },
  {
    icon: Gauge,
    title: "Trois clics maximum",
    text: "Chaque action importante — devis, facture, contrat — se réalise en trois clics, jamais plus.",
  },
  {
    icon: ShieldCheck,
    title: "Vos données protégées",
    text: "Documents chiffrés, coffre-fort sécurisé. Vous restez seul propriétaire de vos informations.",
  },
];

export function WhyShiftOffice() {
  return (
    <Section id="pourquoi">
      <SectionHeading
        eyebrow="Pourquoi Shift Office"
        title="Un vrai collaborateur, pas un logiciel de plus"
        subtitle="Shift Office travaille pour vous. Pensé pour les artisans, conçu pour faire gagner du temps dès la première minute."
      />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {REASONS.map((r) => (
          <div key={r.title} className="text-left">
            <div className="bg-brand-50 text-brand inline-flex h-12 w-12 items-center justify-center rounded-2xl">
              <r.icon size={22} />
            </div>
            <h3 className="text-ink mt-5 text-lg font-semibold tracking-tight">
              {r.title}
            </h3>
            <p className="text-muted mt-2 text-[0.95rem] leading-relaxed">
              {r.text}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
