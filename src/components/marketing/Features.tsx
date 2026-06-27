import Image from "next/image";
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

      <div className="stagger mt-14 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {/* Assistant IA — héros sombre, horizontal */}
        <FeatureCard
          variant="dark"
          horizontal
          badge="Le cœur de Shift Office"
          icon={Sparkles}
          title="Assistant IA bâtiment"
          benefit="Créez un devis en parlant. L'IA rédige les lignes, choisit les prix et calcule la TVA — vous n'avez plus qu'à valider."
          src="/shots/assistant.png"
          alt="Conversation avec l'assistant IA"
          className="sm:col-span-2 lg:col-span-4"
          shotClassName="aspect-[4/3]"
        />

        {/* Devis — carte ORANGE pleine */}
        <FeatureCard
          variant="orange"
          icon={FileText}
          title="Devis, factures & documents"
          benefit="Des documents pros en 30 secondes, prêts à envoyer."
          src="/shots/devis.png"
          alt="Un devis généré par Shift Office"
          className="sm:col-span-1 lg:col-span-2"
          shotClassName="flex-1 min-h-[180px]"
        />

        {/* Tableau de bord — clair */}
        <FeatureCard
          variant="light"
          icon={BarChart3}
          title="Tableau de bord"
          benefit="CA, marges et TVA en un coup d'œil. Fini le tableur."
          src="/shots/dashboard.png"
          alt="Tableau de bord"
          className="sm:col-span-1 lg:col-span-2"
          shotClassName="h-40"
          objectClassName="object-[50%_22%]"
        />

        {/* Bibliothèque produits — clair */}
        <FeatureCard
          variant="light"
          icon={Package}
          title="Bibliothèque produits"
          benefit="Vos prix enregistrés une fois, réutilisés à chaque devis."
          src="/shots/produits.png"
          alt="Bibliothèque produits"
          className="sm:col-span-1 lg:col-span-2"
          shotClassName="h-40"
          objectClassName="object-[50%_28%]"
        />

        {/* Coffre-fort — carte sombre */}
        <FeatureCard
          variant="dark"
          icon={ShieldCheck}
          title="Coffre-fort sécurisé"
          benefit="Tous vos documents chiffrés, retrouvés en un instant."
          src="/shots/coffre.png"
          alt="Coffre-fort sécurisé"
          className="sm:col-span-1 lg:col-span-2"
          shotClassName="h-40"
          objectClassName="object-[50%_36%]"
        />

        {/* Profil — bannière large claire, horizontal */}
        <FeatureCard
          variant="light"
          horizontal
          icon={Building2}
          title="Profil entreprise"
          benefit="Logo, SIRET et TVA repris automatiquement sur tous vos documents. Renseignés une fois, c'est tout."
          src="/shots/profil.png"
          alt="Profil entreprise"
          className="sm:col-span-2 lg:col-span-6"
          shotClassName="aspect-[16/7] sm:aspect-[5/2]"
          objectClassName="object-[50%_30%]"
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
    frame: string;
    glow?: string;
  }
> = {
  light: {
    card: "bg-paper border-line text-ink shadow-[var(--shadow-card)]",
    title: "text-ink",
    benefit: "text-muted",
    iconChip: "bg-brand-50 text-brand",
    frame: "border-line",
  },
  dark: {
    card: "bg-ink border-ink text-paper shadow-[var(--shadow-pop)]",
    title: "text-paper",
    benefit: "text-white/70",
    iconChip: "bg-brand/15 text-brand",
    frame: "border-white/10",
    glow: "radial-gradient(55% 70% at 85% 8%, rgba(255,107,43,0.30) 0%, transparent 65%)",
  },
  orange: {
    card: "bg-brand border-brand-600 text-paper shadow-[var(--shadow-brand)]",
    title: "text-paper",
    benefit: "text-white/85",
    iconChip: "bg-white/20 text-paper",
    frame: "border-white/25",
    glow: "radial-gradient(60% 60% at 80% 0%, rgba(255,255,255,0.22) 0%, transparent 60%)",
  },
};

function FeatureCard({
  icon: Icon,
  title,
  benefit,
  src,
  alt,
  variant = "light",
  horizontal = false,
  badge,
  className,
  shotClassName,
  objectClassName,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  benefit: string;
  src: string;
  alt: string;
  variant?: Variant;
  horizontal?: boolean;
  badge?: string;
  className?: string;
  shotClassName?: string;
  objectClassName?: string;
}) {
  const s = STYLES[variant];

  const text = (
    <div className={horizontal ? "" : ""}>
      {badge ? (
        <span className="bg-brand/15 text-brand inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
          <Sparkles size={13} />
          {badge}
        </span>
      ) : (
        <div
          className={cn(
            "inline-flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105",
            s.iconChip
          )}
        >
          <Icon size={20} />
        </div>
      )}
      <h3 className={cn("mt-4 text-lg font-semibold tracking-tight", s.title, badge && "text-2xl")}>
        {title}
      </h3>
      <p className={cn("mt-2 text-[0.95rem] leading-relaxed", s.benefit)}>
        {benefit}
      </p>
    </div>
  );

  const shot = (
    <div
      className={cn(
        "bg-paper relative overflow-hidden rounded-xl border shadow-[var(--shadow-card)]",
        s.frame,
        shotClassName
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        sizes="(max-width: 1024px) 100vw, 50vw"
        className={cn("object-cover object-top", objectClassName)}
      />
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
          {text}
          <div className="transition-transform duration-500 ease-out group-hover:-translate-y-1">
            {shot}
          </div>
        </div>
      ) : (
        <div className="relative flex flex-1 flex-col">
          {text}
          <div className="mt-5 flex flex-1 flex-col justify-end transition-transform duration-500 ease-out group-hover:-translate-y-1">
            {shot}
          </div>
        </div>
      )}
    </div>
  );
}
