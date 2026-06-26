import { Section, SectionHeading } from "@/components/ui/Section";

const TRADES = [
  "Plombier",
  "Carreleur",
  "Électricien",
  "Plaquiste",
  "Maçon",
  "Chauffagiste",
  "Peintre",
  "Menuisier",
  "Paysagiste",
];

export function Trades() {
  return (
    <Section id="metiers" className="bg-mist/60">
      <SectionHeading
        eyebrow="Métiers"
        title="Pensé pour les artisans du bâtiment"
        subtitle="Shift Office s'adapte à votre métier. Une seule promesse : vous faire gagner du temps."
      />

      <div className="mx-auto mt-12 flex max-w-3xl flex-wrap justify-center gap-3">
        {TRADES.map((trade) => (
          <span
            key={trade}
            className="border-line bg-paper text-ink rounded-full border px-5 py-2.5 text-sm font-medium shadow-[var(--shadow-soft)] transition-colors hover:border-brand/40"
          >
            {trade}
          </span>
        ))}
      </div>
    </Section>
  );
}
