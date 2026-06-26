import { Container } from "@/components/ui/Container";

type Block = { heading: string; paragraphs: string[] };

export function LegalPage({
  title,
  updatedAt,
  blocks,
}: {
  title: string;
  updatedAt: string;
  blocks: Block[];
}) {
  return (
    <article className="py-16 sm:py-20">
      <Container size="narrow">
        <p className="text-brand text-sm font-semibold">Informations légales</p>
        <h1 className="text-ink mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="text-muted mt-3 text-sm">
          Dernière mise à jour : {updatedAt}
        </p>

        <div className="mt-12 space-y-10">
          {blocks.map((block) => (
            <section key={block.heading}>
              <h2 className="text-ink text-xl font-semibold tracking-tight">
                {block.heading}
              </h2>
              <div className="mt-3 space-y-4">
                {block.paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className="text-muted leading-relaxed text-pretty"
                  >
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="text-muted mt-14 text-sm leading-relaxed">
          Ce document est fourni à titre informatif dans le cadre de la
          version 1 de Shift Office. Son contenu sera complété et validé
          juridiquement avant la mise en production.
        </p>
      </Container>
    </article>
  );
}
