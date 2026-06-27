import { Section, SectionHeading } from "@/components/ui/Section";

const STEPS = [
  {
    n: "01",
    title: "Créez votre compte",
    text: "Inscrivez-vous en moins d'une minute et renseignez votre profil entreprise.",
  },
  {
    n: "02",
    title: "Laissez l'IA travailler",
    text: "Documents, devis, factures, organisation : l'assistant s'occupe du plus pénible.",
  },
  {
    n: "03",
    title: "Gagnez du temps",
    text: "Retrouvez plusieurs heures par semaine et concentrez-vous sur vos chantiers.",
  },
];

export function HowItWorks() {
  return (
    <Section id="etapes">
      <SectionHeading
        eyebrow="Comment ça marche"
        title="Simple, du premier au dernier clic"
        subtitle="Aucune formation, aucun manuel. Trois étapes, et votre journée s'allège."
      />

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.n} className="relative">
            <span className="font-serif text-brand/25 text-6xl font-medium">
              {step.n}
            </span>
            <h3 className="text-ink mt-2 text-xl font-semibold tracking-tight">
              {step.title}
            </h3>
            <p className="text-muted mt-2 leading-relaxed">{step.text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
