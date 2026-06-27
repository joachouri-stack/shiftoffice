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
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function Features() {
  return (
    <Section id="fonctionnalites" className="bg-mist/50">
      <SectionHeading
        eyebrow="Pourquoi Shift Office"
        title="Tout ce qu'il faut pour gagner des heures"
        subtitle="Six outils pensés pour les artisans. Chacun vous fait gagner du temps, dès le premier jour."
      />

      <div className="stagger mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {/* Assistant IA — vedette (carte sombre) */}
        <Card className="bg-ink group relative overflow-hidden p-7 sm:p-8 sm:col-span-2 lg:col-span-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(55% 70% at 85% 10%, rgba(255,107,43,0.28) 0%, transparent 65%)",
            }}
          />
          <div className="relative grid items-center gap-7 lg:grid-cols-2">
            <div>
              <span className="bg-brand/15 text-brand inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
                <Sparkles size={13} />
                Le cœur de Shift Office
              </span>
              <h3 className="text-paper mt-4 text-2xl font-semibold tracking-tight">
                Assistant IA bâtiment
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-white/70">
                Créez un devis en parlant. L&apos;IA rédige les lignes, choisit
                les prix et calcule la TVA — vous n&apos;avez plus qu&apos;à
                valider.
              </p>
            </div>
            <Shot
              src="/shots/assistant.png"
              alt="Conversation avec l'assistant IA de Shift Office"
              dark
              className="aspect-[4/3] transition-transform duration-500 ease-out group-hover:-translate-y-1"
            />
          </div>
        </Card>

        {/* Devis, factures & documents */}
        <FeatureCard
          className="sm:col-span-2 lg:col-span-2"
          icon={FileText}
          title="Devis, factures & documents"
          benefit="Des documents professionnels en 30 secondes, prêts à envoyer."
          src="/shots/devis.png"
          alt="Un devis généré par Shift Office"
          shotClassName="flex-1 min-h-[200px]"
        />

        {/* Bibliothèque produits */}
        <FeatureCard
          className="sm:col-span-1 lg:col-span-3"
          icon={Package}
          title="Bibliothèque produits"
          benefit="Vos prix enregistrés une fois, réutilisés à chaque devis."
          src="/shots/produits.png"
          alt="Bibliothèque produits"
          shotClassName="h-44"
          objectClassName="object-[50%_28%]"
        />

        {/* Tableau de bord */}
        <FeatureCard
          className="sm:col-span-1 lg:col-span-3"
          icon={BarChart3}
          title="Tableau de bord"
          benefit="Chiffre d'affaires, marges et TVA en un coup d'œil. Fini le tableur."
          src="/shots/dashboard.png"
          alt="Tableau de bord Shift Office"
          shotClassName="h-44"
          objectClassName="object-[50%_22%]"
        />

        {/* Profil entreprise */}
        <FeatureCard
          className="sm:col-span-1 lg:col-span-3"
          icon={Building2}
          title="Profil entreprise"
          benefit="Logo, SIRET et TVA repris automatiquement sur tous vos documents."
          src="/shots/profil.png"
          alt="Profil entreprise"
          shotClassName="h-44"
          objectClassName="object-[50%_30%]"
        />

        {/* Coffre-fort */}
        <FeatureCard
          className="sm:col-span-1 lg:col-span-3"
          icon={ShieldCheck}
          title="Coffre-fort sécurisé"
          benefit="Tous vos documents chiffrés, retrouvés en un instant."
          src="/shots/coffre.png"
          alt="Coffre-fort sécurisé"
          shotClassName="h-44"
          objectClassName="object-[50%_38%]"
        />
      </div>
    </Section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  benefit,
  src,
  alt,
  className,
  shotClassName,
  objectClassName,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  benefit: string;
  src: string;
  alt: string;
  className?: string;
  shotClassName?: string;
  objectClassName?: string;
}) {
  return (
    <Card
      interactive
      className={cn("group flex flex-col overflow-hidden p-6 sm:p-7", className)}
    >
      <div className="bg-brand-50 text-brand inline-flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105">
        <Icon size={20} />
      </div>
      <h3 className="text-ink mt-4 text-lg font-semibold tracking-tight">
        {title}
      </h3>
      <p className="text-muted mt-1.5 text-[0.95rem] leading-relaxed">
        {benefit}
      </p>
      <Shot
        src={src}
        alt={alt}
        className={cn(
          "mt-5 transition-transform duration-500 ease-out group-hover:-translate-y-1",
          shotClassName
        )}
        objectClassName={objectClassName}
      />
    </Card>
  );
}

/** Capture d'écran encadrée du produit. */
function Shot({
  src,
  alt,
  className,
  objectClassName,
  dark,
}: {
  src: string;
  alt: string;
  className?: string;
  objectClassName?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-paper relative overflow-hidden rounded-xl border shadow-[var(--shadow-card)]",
        dark ? "border-white/10" : "border-line",
        className
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
}
