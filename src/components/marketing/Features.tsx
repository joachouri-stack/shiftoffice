import {
  Sparkles,
  FileText,
  ShieldCheck,
  Package,
  BarChart3,
  Building2,
  Check,
  Lock,
} from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function Features() {
  return (
    <Section id="fonctionnalites">
      <SectionHeading
        eyebrow="Pourquoi Shift Office"
        title="Tout ce qu'il faut pour gagner des heures"
        subtitle="Six outils pensés pour les artisans. Chacun vous fait gagner du temps, dès le premier jour."
      />

      <div className="stagger mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {/* Assistant IA — vedette */}
        <FeatureCard
          className="sm:col-span-2 lg:col-span-4"
          icon={Sparkles}
          title="Assistant IA bâtiment"
          benefit="Créez un devis en parlant. L'IA rédige les lignes, choisit les prix et calcule la TVA — vous n'avez plus qu'à valider."
          featured
        >
          <ChatVisual />
        </FeatureCard>

        {/* Coffre-fort */}
        <FeatureCard
          className="sm:col-span-2 lg:col-span-2"
          icon={ShieldCheck}
          title="Coffre-fort sécurisé"
          benefit="Tous vos documents chiffrés, retrouvés en un instant."
        >
          <VaultVisual />
        </FeatureCard>

        {/* Devis & factures */}
        <FeatureCard
          className="sm:col-span-1 lg:col-span-3"
          icon={FileText}
          title="Devis, factures & documents"
          benefit="Des documents professionnels en 30 secondes, prêts à envoyer."
        >
          <DocVisual />
        </FeatureCard>

        {/* Tableau de bord */}
        <FeatureCard
          className="sm:col-span-1 lg:col-span-3"
          icon={BarChart3}
          title="Tableau de bord"
          benefit="Chiffre d'affaires, marges et TVA en un coup d'œil. Fini le tableur."
        >
          <ChartVisual />
        </FeatureCard>

        {/* Bibliothèque produits */}
        <FeatureCard
          className="sm:col-span-1 lg:col-span-3"
          icon={Package}
          title="Bibliothèque produits"
          benefit="Vos prix enregistrés une fois, réutilisés à chaque devis."
        >
          <ProductsVisual />
        </FeatureCard>

        {/* Profil entreprise */}
        <FeatureCard
          className="sm:col-span-1 lg:col-span-3"
          icon={Building2}
          title="Profil entreprise"
          benefit="Logo, SIRET et TVA repris automatiquement sur tous vos documents."
        >
          <ProfileVisual />
        </FeatureCard>
      </div>
    </Section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  benefit,
  children,
  className,
  featured,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  benefit: string;
  children?: React.ReactNode;
  className?: string;
  featured?: boolean;
}) {
  return (
    <Card
      interactive
      className={cn(
        "flex flex-col overflow-hidden p-6 sm:p-7",
        featured && "bg-mist/30",
        className
      )}
    >
      <div className="bg-brand-50 text-brand inline-flex h-11 w-11 items-center justify-center rounded-2xl">
        <Icon size={20} />
      </div>
      <h3 className="text-ink mt-4 text-lg font-semibold tracking-tight">
        {title}
      </h3>
      <p className="text-muted mt-1.5 text-[0.95rem] leading-relaxed">
        {benefit}
      </p>
      {children && <div className="mt-5 flex-1">{children}</div>}
    </Card>
  );
}

/* ---------------- Mini-visuels (CSS, sans images) ---------------- */

function ChatVisual() {
  return (
    <div className="border-line bg-paper grid gap-3 rounded-2xl border p-4 sm:grid-cols-[1fr_auto] sm:items-end">
      <div className="space-y-3">
        <div className="bg-ink text-paper ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2 text-sm">
          Devis pour une douche italienne de 5 m²
        </div>
        <div className="flex items-start gap-2">
          <span className="bg-brand text-paper inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
            <Sparkles size={14} />
          </span>
          <div className="border-line bg-mist/50 text-ink space-y-1.5 rounded-2xl rounded-tl-md border px-3.5 py-2.5 text-sm">
            <p className="text-muted text-xs">J&apos;ai ajouté 8 lignes :</p>
            {["Receveur extra-plat", "Paroi verre", "Main-d'œuvre · 12 h"].map(
              (l) => (
                <p key={l} className="flex items-center gap-1.5">
                  <Check size={13} className="text-brand" />
                  {l}
                </p>
              )
            )}
            <p className="text-ink pt-1 font-semibold">Total : 1 480 € TTC</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function VaultVisual() {
  return (
    <div className="space-y-2">
      {["Facture · Dupont", "Devis · Lefèvre", "Attestation TVA"].map((d) => (
        <div
          key={d}
          className="border-line bg-paper flex items-center gap-2.5 rounded-xl border px-3 py-2"
        >
          <span className="bg-brand-50 text-brand inline-flex h-6 w-6 items-center justify-center rounded-md">
            <Lock size={12} />
          </span>
          <span className="text-ink truncate text-xs font-medium">{d}</span>
        </div>
      ))}
    </div>
  );
}

function DocVisual() {
  return (
    <div className="border-line bg-paper rounded-2xl border p-4">
      <div className="flex items-center justify-between">
        <div className="bg-ink/10 h-2.5 w-16 rounded-full" />
        <div className="bg-brand/30 h-2.5 w-10 rounded-full" />
      </div>
      <div className="mt-3 space-y-2">
        {[80, 65, 72].map((w, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div
              className="bg-line h-2 rounded-full"
              style={{ width: `${w}%` }}
            />
            <div className="bg-line h-2 w-8 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
      <div className="border-line mt-3 flex items-center justify-between border-t pt-2.5">
        <span className="text-muted text-xs">Total TTC</span>
        <span className="text-ink text-sm font-semibold">2 310 €</span>
      </div>
    </div>
  );
}

function ChartVisual() {
  const bars = [40, 62, 48, 80, 70, 100];
  return (
    <div className="border-line bg-paper flex h-28 items-end justify-between gap-2 rounded-2xl border p-4">
      {bars.map((h, i) => (
        <div
          key={i}
          className="bg-brand/15 flex-1 rounded-t-md"
          style={{ height: `${h}%` }}
        >
          <div className="bg-brand h-1 w-full rounded-t-md" />
        </div>
      ))}
    </div>
  );
}

function ProductsVisual() {
  const items = [
    ["Placo BA13", "4,90 €"],
    ["Colle carrelage", "18,00 €"],
    ["Peinture mate", "32,00 €"],
  ];
  return (
    <div className="space-y-2">
      {items.map(([name, price]) => (
        <div
          key={name}
          className="border-line bg-paper flex items-center justify-between gap-2 rounded-xl border px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <span className="bg-mist text-muted inline-flex h-6 w-6 items-center justify-center rounded-md">
              <Package size={12} />
            </span>
            <span className="text-ink text-xs font-medium">{name}</span>
          </div>
          <span className="text-ink text-xs font-semibold tabular">{price}</span>
        </div>
      ))}
    </div>
  );
}

function ProfileVisual() {
  return (
    <div className="border-line bg-paper rounded-2xl border p-4">
      <div className="flex items-center gap-3">
        <span className="bg-brand-50 text-brand inline-flex h-10 w-10 items-center justify-center rounded-xl">
          <Building2 size={18} />
        </span>
        <div className="space-y-1.5">
          <div className="bg-ink/15 h-2.5 w-28 rounded-full" />
          <div className="bg-line h-2 w-20 rounded-full" />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <span className="bg-mist text-muted rounded-md px-2 py-1 text-[0.65rem] font-medium">
          SIRET
        </span>
        <span className="bg-mist text-muted rounded-md px-2 py-1 text-[0.65rem] font-medium">
          TVA
        </span>
        <span className="bg-mist text-muted rounded-md px-2 py-1 text-[0.65rem] font-medium">
          Logo
        </span>
      </div>
    </div>
  );
}
