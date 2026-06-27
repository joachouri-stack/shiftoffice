import {
  Sparkles,
  FileText,
  ShieldCheck,
  Package,
  BarChart3,
  Building2,
  ArrowUpRight,
} from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Assistant IA bâtiment",
    benefit:
      "Parlez-lui comme à un collaborateur. Il rédige vos devis, calcule la TVA et choisit les prix. Vous validez.",
    featured: true,
  },
  {
    icon: FileText,
    title: "Devis, factures & documents",
    benefit:
      "Des documents professionnels en quelques secondes, prêts à envoyer à vos clients.",
  },
  {
    icon: BarChart3,
    title: "Tableau de bord",
    benefit:
      "Chiffre d'affaires, marges, TVA et bénéfices, d'un seul coup d'œil. Fini le tableur.",
  },
  {
    icon: Package,
    title: "Bibliothèque produits",
    benefit:
      "Vos matériaux et prix enregistrés une fois, réutilisés automatiquement à chaque devis.",
  },
  {
    icon: ShieldCheck,
    title: "Coffre-fort sécurisé",
    benefit:
      "Tous vos documents chiffrés, au même endroit, retrouvés en un instant.",
  },
  {
    icon: Building2,
    title: "Profil entreprise",
    benefit:
      "Logo, SIRET et TVA renseignés une fois, repris automatiquement sur chacun de vos documents.",
  },
];

export function Features() {
  return (
    <Section id="fonctionnalites">
      <SectionHeading
        eyebrow="Fonctionnalités"
        title="Tout ce qu'il faut pour gagner des heures"
        subtitle="Six outils pensés pour les artisans. Chacun vous fait gagner du temps, dès le premier jour."
      />

      <div className="stagger mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <article
            key={f.title}
            className="group bg-paper relative flex flex-col overflow-hidden p-8 transition-colors duration-300 hover:bg-mist/30 sm:p-10"
          >
            {/* sheen orange très discret */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: "rgba(255,107,43,0.12)" }}
            />

            <div className="relative flex items-start justify-between">
              <span
                className={cn(
                  "inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 transition-transform duration-300 group-hover:scale-105",
                  f.featured
                    ? "bg-brand text-paper shadow-[var(--shadow-brand)] ring-transparent"
                    : "from-brand-50 ring-brand-100 text-brand bg-gradient-to-b to-white"
                )}
              >
                <f.icon size={22} />
              </span>
              {f.featured && (
                <span className="bg-brand-50 text-brand inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">
                  <Sparkles size={11} />
                  Vedette
                </span>
              )}
            </div>

            <h3 className="text-ink mt-6 text-xl font-semibold tracking-tight">
              {f.title}
            </h3>
            <p className="text-muted mt-2.5 text-[0.95rem] leading-relaxed text-pretty">
              {f.benefit}
            </p>

            <span className="text-muted/0 group-hover:text-brand mt-6 inline-flex items-center gap-1 text-sm font-medium transition-colors duration-300">
              En savoir plus
              <ArrowUpRight
                size={15}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </span>
          </article>
        ))}
      </div>
    </Section>
  );
}
