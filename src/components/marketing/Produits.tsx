import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DOCUMENTS, formatPrice, type DocItem } from "@/lib/documents";

export function Produits() {
  return (
    <section id="produits" className="bg-creme py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-or text-sm font-bold uppercase tracking-[0.16em]">
            Documents disponibles
          </p>
          <h2 className="font-display text-noir mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Choisissez votre document
          </h2>
          <p className="text-gris mt-4 text-lg leading-relaxed">
            Conformes à la législation française 2026. Remplissez, payez si
            besoin, téléchargez votre PDF immédiatement.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DOCUMENTS.map((doc) => (
            <DocCard key={doc.slug} doc={doc} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DocCard({ doc }: { doc: DocItem }) {
  return (
    <article className="border-or-border flex flex-col overflow-hidden rounded-xl border-[2.5px] bg-white shadow-sm transition-transform duration-200 hover:-translate-y-1">
      {/* Bloc supérieur — crème */}
      <div className="bg-creme flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-noir text-xl font-bold tracking-tight">
            {doc.title}
          </h3>
          <span className="bg-vert-l text-vert shrink-0 rounded-md border border-emerald-200 px-2 py-0.5 text-xs font-bold">
            {doc.badge}
          </span>
        </div>

        <p className="text-gris mt-2 text-sm leading-relaxed">{doc.desc}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {doc.tags.map((t) => (
            <span
              key={t}
              className="border-or/60 rounded-md border bg-[#FDF0CC] px-2 py-0.5 text-[0.7rem] font-semibold text-[#7A5C1E]"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Séparateur doré */}
      <div className="bg-or h-[2px]" />

      {/* Bloc inférieur — blanc */}
      <div className="flex items-center justify-between bg-white p-5">
        <span className="text-orange font-display text-2xl font-extrabold">
          {formatPrice(doc.price)}
          {doc.price > 0 && (
            <span className="text-gris ml-1 text-sm font-medium">/ doc</span>
          )}
        </span>
        <Link
          href={
            doc.slug === "fiche-paie"
              ? "/fiche-de-paie"
              : doc.slug === "solde-tout-compte"
                ? "/solde-tout-compte"
                : doc.slug === "rupture-conventionnelle"
                  ? "/rupture-conventionnelle"
                  : doc.slug === "certificat-travail"
                    ? "/certificat-travail"
                    : doc.slug === "attestation-employeur"
                      ? "/attestation-employeur"
                      : doc.slug === "contrat-travail"
                        ? "/contrat-travail"
                        : doc.slug === "quittance-loyer"
                          ? "/quittance-loyer"
                          : doc.slug === "bail-commercial"
                            ? "/bail-commercial"
                            : doc.slug === "statuts-societe"
                              ? "/statuts-societe"
                              : doc.slug === "note-de-frais"
                                ? "/note-de-frais"
                                : doc.slug === "avenant-contrat"
                                  ? "/avenant-contrat"
                                  : `/generer/${doc.slug}`
          }
          className="bg-orange hover:bg-orange-d inline-flex items-center gap-1.5 rounded-[10px] px-4 py-2.5 text-sm font-bold text-white transition-colors"
        >
          Générer
          <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}
