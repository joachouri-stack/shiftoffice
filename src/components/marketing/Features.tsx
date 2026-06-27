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
                "radial-gradient(55% 60% at 85% 0%, rgba(255,107,43,0.28) 0%, transparent 65%)",
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
            <div className="transition-transform duration-300 ease-out group-hover:-translate-y-1">
              <ChatVisual />
            </div>
          </div>
        </Card>

        {/* Devis, factures & documents — grand format */}
        <FeatureCard
          className="sm:col-span-2 lg:col-span-2"
          icon={FileText}
          title="Devis, factures & documents"
          benefit="Des documents professionnels en 30 secondes, prêts à envoyer."
        >
          <DocVisual />
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

        {/* Tableau de bord */}
        <FeatureCard
          className="sm:col-span-1 lg:col-span-3"
          icon={BarChart3}
          title="Tableau de bord"
          benefit="Chiffre d'affaires, marges et TVA en un coup d'œil. Fini le tableur."
        >
          <ChartVisual />
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

        {/* Coffre-fort */}
        <FeatureCard
          className="sm:col-span-1 lg:col-span-3"
          icon={ShieldCheck}
          title="Coffre-fort sécurisé"
          benefit="Tous vos documents chiffrés, retrouvés en un instant."
        >
          <VaultVisual />
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
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  benefit: string;
  children?: React.ReactNode;
  className?: string;
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
      {children && (
        <div className="mt-5 flex flex-1 flex-col justify-end transition-transform duration-300 ease-out group-hover:-translate-y-0.5">
          {children}
        </div>
      )}
    </Card>
  );
}

/* ---------------- Mini-visuels (CSS, sans images) ---------------- */

function ChatVisual() {
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="bg-brand text-paper ml-auto w-fit max-w-[88%] rounded-2xl rounded-br-md px-3.5 py-2 text-sm shadow-[var(--shadow-brand)]">
        Devis pour une douche italienne de 5 m²
      </div>
      <div className="flex items-start gap-2">
        <span className="bg-brand text-paper inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
          <Sparkles size={14} />
        </span>
        <div className="space-y-1.5 rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-sm text-white/90">
          <p className="text-xs text-white/50">J&apos;ai ajouté 8 lignes :</p>
          {["Receveur extra-plat", "Paroi verre", "Main-d'œuvre · 12 h"].map(
            (l) => (
              <p key={l} className="flex items-center gap-1.5">
                <Check size={13} className="text-brand" />
                {l}
              </p>
            )
          )}
          <p className="text-paper pt-1 font-semibold">Total : 1 480 € TTC</p>
        </div>
      </div>
    </div>
  );
}

/** Mini-document (devis) — pleine hauteur, à côté du héros. */
function DocVisual() {
  return (
    <div className="border-line bg-paper flex h-full flex-col rounded-2xl border p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between">
        <div className="bg-brand/15 h-8 w-8 rounded-lg" />
        <div className="text-right">
          <p className="text-brand text-xs font-bold tracking-wide">DEVIS</p>
          <p className="text-muted text-[0.65rem]">DEV-2026-014</p>
        </div>
      </div>
      <div className="bg-ink/10 mt-3 h-2 w-24 rounded-full" />
      <div className="border-line mt-3 space-y-2 border-t pt-3">
        {[
          ["Receveur", "189"],
          ["Paroi verre", "320"],
          ["Main-d'œuvre", "540"],
        ].map(([n, p]) => (
          <div key={n} className="flex items-center justify-between gap-2">
            <span className="text-ink/80 text-[0.7rem]">{n}</span>
            <span className="text-ink text-[0.7rem] font-medium tabular">
              {p} €
            </span>
          </div>
        ))}
      </div>
      <div className="bg-ink mt-auto flex items-center justify-between rounded-xl px-3 py-2.5">
        <span className="text-xs text-white/70">Total TTC</span>
        <span className="text-paper text-sm font-semibold tabular">1 480 €</span>
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
          className="border-line bg-mist/40 flex items-center gap-2.5 rounded-xl border px-3 py-2"
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

function ChartVisual() {
  const bars = [40, 62, 48, 80, 70, 100];
  return (
    <div className="border-line bg-mist/40 flex h-28 items-end justify-between gap-2 rounded-2xl border p-4">
      {bars.map((h, i) => (
        <div
          key={i}
          className="bg-brand/25 flex-1 overflow-hidden rounded-t-md"
          style={{ height: `${h}%` }}
        >
          <div className="bg-brand h-1.5 w-full rounded-t-md" />
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
          className="border-line bg-mist/40 flex items-center justify-between gap-2 rounded-xl border px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <span className="bg-paper text-brand border-line inline-flex h-6 w-6 items-center justify-center rounded-md border">
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
    <div className="border-line bg-mist/40 rounded-2xl border p-4">
      <div className="flex items-center gap-3">
        <span className="bg-brand-50 text-brand inline-flex h-10 w-10 items-center justify-center rounded-xl">
          <Building2 size={18} />
        </span>
        <div className="space-y-1.5">
          <div className="bg-ink/15 h-2.5 w-28 rounded-full" />
          <div className="bg-ink/10 h-2 w-20 rounded-full" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {["SIRET", "TVA", "Logo"].map((t) => (
          <span
            key={t}
            className="bg-paper border-line text-muted rounded-md border px-2 py-1 text-[0.65rem] font-medium"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
