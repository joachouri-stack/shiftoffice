import {
  Sparkles,
  FileText,
  ShieldCheck,
  Package,
  BarChart3,
  Building2,
} from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { cn } from "@/lib/utils";

type Variant = "light" | "dark" | "orange";

export function Features() {
  return (
    <Section id="fonctionnalites" className="bg-mist/50">
      <SectionHeading
        eyebrow="Pourquoi Shift Office"
        title="Tout ce qu'il faut pour gagner des heures"
        subtitle="Six outils pensés pour les artisans. Chacun vous fait gagner du temps, dès le premier jour."
      />

      <div className="stagger mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {/* Assistant IA — héros sombre */}
        <FeatureCard
          variant="dark"
          horizontal
          badge="Le cœur de Shift Office"
          icon={Sparkles}
          title="Assistant IA bâtiment"
          benefit="Parlez-lui comme à un collaborateur. Il rédige, calcule la TVA et choisit les prix — vous validez."
          chips={[
            "Prépare un devis salle de bain",
            "Réponds à ce client",
            "Calcule ma TVA",
            "Fais un contrat",
          ]}
          chipsAsPrompts
          className="sm:col-span-2 lg:col-span-4"
        />

        {/* Devis — carte ORANGE */}
        <FeatureCard
          variant="orange"
          icon={FileText}
          title="Devis, factures & documents"
          benefit="Des documents professionnels en 30 secondes, prêts à envoyer à vos clients."
          chips={["Devis", "Factures", "Contrats", "Fiches de paie", "Quittances"]}
          className="sm:col-span-1 lg:col-span-2"
        />

        {/* Tableau de bord */}
        <FeatureCard
          variant="light"
          icon={BarChart3}
          title="Tableau de bord"
          benefit="Tout votre business en un coup d'œil. Fini le tableur."
          chips={["Chiffre d'affaires", "Marges", "TVA", "Bénéfices"]}
          className="sm:col-span-1 lg:col-span-2"
        />

        {/* Bibliothèque produits */}
        <FeatureCard
          variant="light"
          icon={Package}
          title="Bibliothèque produits"
          benefit="Vos prix enregistrés une fois, réutilisés à chaque devis."
          chips={["Matériaux", "Main-d'œuvre", "Déplacements", "Locations"]}
          className="sm:col-span-1 lg:col-span-2"
        />

        {/* Coffre-fort — carte sombre */}
        <FeatureCard
          variant="dark"
          icon={ShieldCheck}
          title="Coffre-fort sécurisé"
          benefit="Tous vos documents au même endroit, retrouvés en un instant."
          chips={["Chiffré", "Sauvegardé", "Accessible partout"]}
          className="sm:col-span-1 lg:col-span-2"
        />

        {/* Profil — bannière large */}
        <FeatureCard
          variant="light"
          horizontal
          icon={Building2}
          title="Profil entreprise"
          benefit="Renseignés une fois, repris automatiquement sur chacun de vos documents."
          chips={["Logo", "Nom", "SIRET", "N° TVA", "Adresse", "Téléphone"]}
          className="sm:col-span-2 lg:col-span-6"
        />
      </div>
    </Section>
  );
}

const STYLES: Record<
  Variant,
  {
    card: string;
    title: string;
    benefit: string;
    iconChip: string;
    chip: string;
    dot: string;
    glow?: string;
  }
> = {
  light: {
    card: "bg-paper border-line text-ink shadow-[var(--shadow-card)]",
    title: "text-ink",
    benefit: "text-muted",
    iconChip: "bg-brand-50 text-brand",
    chip: "bg-mist border-line text-ink/80",
    dot: "bg-brand",
  },
  dark: {
    card: "bg-ink border-ink text-paper shadow-[var(--shadow-pop)]",
    title: "text-paper",
    benefit: "text-white/70",
    iconChip: "bg-brand/15 text-brand",
    chip: "bg-white/[0.07] border-white/10 text-white/85",
    dot: "bg-brand",
    glow: "radial-gradient(55% 75% at 88% 6%, rgba(255,107,43,0.30) 0%, transparent 62%)",
  },
  orange: {
    card: "bg-brand border-brand-600 text-paper shadow-[var(--shadow-brand)]",
    title: "text-paper",
    benefit: "text-white/90",
    iconChip: "bg-white/20 text-paper",
    chip: "bg-white/20 border-white/25 text-paper",
    dot: "bg-white",
    glow: "radial-gradient(60% 60% at 85% 0%, rgba(255,255,255,0.20) 0%, transparent 60%)",
  },
};

function FeatureCard({
  icon: Icon,
  title,
  benefit,
  chips,
  chipsAsPrompts = false,
  variant = "light",
  horizontal = false,
  badge,
  className,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  benefit: string;
  chips: string[];
  chipsAsPrompts?: boolean;
  variant?: Variant;
  horizontal?: boolean;
  badge?: string;
  className?: string;
}) {
  const s = STYLES[variant];

  const head = (
    <div>
      {badge ? (
        <span className="bg-brand/15 text-brand inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
          <Sparkles size={13} />
          {badge}
        </span>
      ) : (
        <div
          className={cn(
            "inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105",
            s.iconChip
          )}
        >
          <Icon size={22} />
        </div>
      )}
      <h3
        className={cn(
          "mt-4 font-semibold tracking-tight",
          s.title,
          badge ? "text-2xl" : "text-xl"
        )}
      >
        {title}
      </h3>
      <p className={cn("mt-2 text-[0.95rem] leading-relaxed", s.benefit)}>
        {benefit}
      </p>
    </div>
  );

  const chipList = (
    <div
      className={cn(
        "flex flex-wrap gap-2",
        chipsAsPrompts && "sm:flex-col sm:items-start"
      )}
    >
      {chips.map((c) => (
        <span
          key={c}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium",
            s.chip
          )}
        >
          {chipsAsPrompts ? (
            <Sparkles size={12} className="text-brand shrink-0" />
          ) : (
            <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
          )}
          {c}
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-0.5 sm:p-7",
        s.card,
        className
      )}
    >
      {s.glow && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: s.glow }}
        />
      )}
      {horizontal ? (
        <div className="relative grid flex-1 items-center gap-6 lg:grid-cols-2">
          {head}
          {chipList}
        </div>
      ) : (
        <div className="relative flex flex-1 flex-col">
          {head}
          <div className="mt-6 flex flex-1 items-end">{chipList}</div>
        </div>
      )}
    </div>
  );
}
