"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Wrench,
  Droplet,
  Zap,
  PaintRoller,
  BrickWall,
  Hammer,
  MoreHorizontal,
  Building2,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  useCompanyProfile,
  type CompanyProfile,
  type FiscalRegime,
} from "@/lib/companyProfile";
import { cn } from "@/lib/utils";

const TRADES: { label: string; icon: LucideIcon }[] = [
  { label: "Carreleur", icon: Wrench },
  { label: "Plombier", icon: Droplet },
  { label: "Électricien", icon: Zap },
  { label: "Peintre", icon: PaintRoller },
  { label: "Maçon", icon: BrickWall },
  { label: "Menuisier", icon: Hammer },
  { label: "Autre", icon: MoreHorizontal },
];

const STEPS = [
  { title: "Votre métier", subtitle: "Pour personnaliser vos documents et l'assistant." },
  { title: "Régime fiscal", subtitle: "Cela détermine la mention légale de vos factures." },
  { title: "TVA", subtitle: "La plupart des artisans en micro n'y sont pas assujettis." },
  { title: "Coordonnées", subtitle: "Ces informations apparaîtront sur tous vos documents." },
  { title: "C'est parti !", subtitle: "Vérifiez votre configuration avant de démarrer." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, save } = useCompanyProfile();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CompanyProfile>(profile);
  // Le métier est « personnalisé » s'il n'est pas dans la liste prédéfinie.
  const [customTrade, setCustomTrade] = useState(
    profile.trade !== "" && !TRADES.some((t) => t.label === profile.trade)
  );

  function update<K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const last = STEPS.length - 1;
  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  function canContinue(): boolean {
    if (step === 0) return form.name.trim() !== "" && form.trade.trim() !== "";
    if (step === 3) return form.email.trim() !== "";
    return true;
  }

  function next() {
    // Sauvegarde automatique à chaque étape.
    save(form);
    if (step < last) setStep((s) => s + 1);
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  function finish() {
    save({ ...form, onboardingComplete: true });
    router.push("/dashboard");
  }

  return (
    <div className="bg-glow relative flex min-h-dvh flex-col">
      <div className="bg-grid absolute inset-0 -z-10 opacity-50" />

      {/* En-tête + progression */}
      <header className="px-5 pt-6 sm:px-8">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <Logo size="md" />
          <span className="text-muted text-sm font-medium tabular">
            Étape {step + 1} / {STEPS.length}
          </span>
        </div>
        <div className="bg-line mx-auto mt-4 h-1.5 max-w-xl overflow-hidden rounded-full">
          <div
            className="bg-brand h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-8 sm:py-12">
        <div key={step} className="reveal w-full max-w-xl">
          <div className="mb-8 text-center">
            <h1 className="text-ink text-2xl font-semibold tracking-tight sm:text-3xl">
              {STEPS[step].title}
            </h1>
            <p className="text-muted mt-2 text-[0.95rem]">{STEPS[step].subtitle}</p>
          </div>

          {/* Étape 1 — Métier */}
          {step === 0 && (
            <div className="space-y-6">
              <Input
                label="Nom de l'entreprise"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Ex. Plomberie Martin"
                autoFocus
              />
              <div>
                <p className="text-ink mb-2.5 text-sm font-medium">Métier principal</p>
                <div className="flex flex-wrap gap-2.5">
                  {TRADES.map((t) => {
                    const isCustom = t.label === "Autre";
                    const active = isCustom
                      ? customTrade
                      : !customTrade && form.trade === t.label;
                    return (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => {
                          if (isCustom) {
                            setCustomTrade(true);
                            update("trade", "");
                          } else {
                            setCustomTrade(false);
                            update("trade", t.label);
                          }
                        }}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                          active
                            ? "border-brand bg-brand text-paper shadow-[var(--shadow-brand)]"
                            : "border-line bg-paper text-ink hover:border-brand/40 hover:bg-mist"
                        )}
                      >
                        <t.icon size={15} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
                {customTrade && (
                  <div className="mt-4">
                    <Input
                      label="Précisez votre métier"
                      value={form.trade}
                      onChange={(e) => update("trade", e.target.value)}
                      placeholder="Ex. Plaquiste"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Étape 2 — Régime fiscal */}
          {step === 1 && (
            <div className="space-y-3">
              <RadioCard
                active={form.fiscalRegime === "micro"}
                onClick={() => update("fiscalRegime", "micro" as FiscalRegime)}
                title="Micro-entreprise"
                desc="Auto-entrepreneur. Comptabilité simplifiée, pas de TVA par défaut."
                badge="Le plus courant"
              />
              <RadioCard
                active={form.fiscalRegime === "societe"}
                onClick={() => update("fiscalRegime", "societe" as FiscalRegime)}
                title="Société"
                desc="SASU, EURL, SAS, SARL. Régime réel d'imposition."
              />
            </div>
          )}

          {/* Étape 3 — TVA */}
          {step === 2 && (
            <div className="space-y-3">
              <RadioCard
                active={!form.vatLiable}
                onClick={() => {
                  update("vatLiable", false);
                  update("vatRate", 0);
                }}
                title="Non — Franchise en base"
                desc="Article 293 B du CGI. Vous ne facturez pas la TVA à vos clients."
                badge="Recommandé en micro"
              />
              <RadioCard
                active={form.vatLiable}
                onClick={() => {
                  update("vatLiable", true);
                  if (form.vatRate === 0) update("vatRate", 20);
                }}
                title="Oui — Assujetti à la TVA"
                desc="Vous collectez et reversez la TVA."
              />
              {form.vatLiable && (
                <div className="border-line bg-paper mt-2 rounded-2xl border p-4">
                  <p className="text-ink mb-2.5 text-sm font-medium">Taux principal</p>
                  <div className="flex gap-2.5">
                    {[10, 20].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => update("vatRate", rate)}
                        className={cn(
                          "flex-1 rounded-xl border py-3 text-sm font-semibold transition-all duration-200",
                          form.vatRate === rate
                            ? "border-brand bg-brand text-paper shadow-[var(--shadow-brand)]"
                            : "border-line bg-paper text-ink hover:border-brand/40"
                        )}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                  <p className="text-muted mt-2.5 text-xs">
                    10% pour la rénovation de logements de plus de 2 ans, 20% en général.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Étape 4 — Coordonnées */}
          {step === 3 && (
            <div className="space-y-5">
              <Input
                label="Adresse"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="12 rue des Artisans"
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Code postal"
                  value={form.postalCode}
                  onChange={(e) => update("postalCode", e.target.value)}
                  placeholder="75000"
                  inputMode="numeric"
                />
                <Input
                  label="Ville"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="Paris"
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Téléphone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="06 12 34 56 78"
                />
                <Input
                  label="SIRET (optionnel)"
                  value={form.siret}
                  onChange={(e) => update("siret", e.target.value)}
                  placeholder="123 456 789 00012"
                />
              </div>
              <Input
                label="Email professionnel"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="contact@entreprise.fr"
                hint="Utilisé pour l'envoi de vos devis et factures."
              />
            </div>
          )}

          {/* Étape 5 — Récapitulatif */}
          {step === 4 && (
            <div className="border-line bg-paper rounded-3xl border p-6 shadow-[var(--shadow-card)] sm:p-7">
              <div className="bg-brand-50 text-brand mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl">
                <Check size={28} strokeWidth={2.5} />
              </div>
              <dl className="divide-line divide-y">
                <RecapRow icon={Building2} label="Entreprise" value={form.name || "—"} />
                <RecapRow icon={Wrench} label="Métier" value={form.trade || "—"} />
                <RecapRow
                  icon={Receipt}
                  label="Régime"
                  value={form.fiscalRegime === "micro" ? "Micro-entreprise" : "Société"}
                />
                <RecapRow
                  icon={Receipt}
                  label="TVA"
                  value={
                    form.vatLiable
                      ? `Assujetti — ${form.vatRate}%`
                      : "Franchise (art. 293 B)"
                  }
                />
                <RecapRow
                  icon={Building2}
                  label="Adresse"
                  value={
                    [form.address, [form.postalCode, form.city].filter(Boolean).join(" ")]
                      .filter(Boolean)
                      .join(", ") || "—"
                  }
                />
              </dl>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 0 ? (
              <Button type="button" variant="ghost" onClick={back}>
                <ArrowLeft size={17} />
                Retour
              </Button>
            ) : (
              <span />
            )}
            {step < last ? (
              <Button type="button" onClick={next} disabled={!canContinue()}>
                Continuer
                <ArrowRight size={17} />
              </Button>
            ) : (
              <Button type="button" onClick={finish}>
                Accéder à mon tableau de bord
                <ArrowRight size={17} />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function RadioCard({
  active,
  onClick,
  title,
  desc,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-200",
        active
          ? "border-brand bg-brand-50/50 ring-1 ring-brand/15"
          : "border-line bg-paper hover:border-brand/30 hover:bg-mist/40"
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          active ? "border-brand bg-brand text-paper" : "border-line bg-paper"
        )}
      >
        {active && <Check size={12} strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-ink font-semibold">{title}</span>
          {badge && (
            <span className="bg-brand-50 text-brand inline-flex rounded-full px-2 py-0.5 text-xs font-semibold">
              {badge}
            </span>
          )}
        </span>
        <span className="text-muted mt-1 block text-sm leading-relaxed">{desc}</span>
      </span>
    </button>
  );
}

function RecapRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="bg-mist text-muted inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
        <Icon size={16} />
      </span>
      <span className="text-muted w-24 shrink-0 text-sm">{label}</span>
      <span className="text-ink ml-auto truncate text-right text-sm font-medium">
        {value}
      </span>
    </div>
  );
}
