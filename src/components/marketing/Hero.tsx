import {
  ArrowRight,
  Sparkles,
  PlayCircle,
  LayoutDashboard,
  FileText,
  FolderClosed,
  ShieldCheck,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="bg-glow relative overflow-hidden">
      <div className="bg-grid absolute inset-0 -z-10 opacity-60" />
      <Container className="pt-16 pb-20 text-center sm:pt-24 lg:pt-28">
        <div className="animate-in flex justify-center">
          <Badge variant="outline">
            <Sparkles size={13} className="text-brand" />
            Propulsé par l&apos;intelligence artificielle
          </Badge>
        </div>

        <h1 className="animate-in text-ink mx-auto mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-[4.25rem] lg:leading-[1.05]">
          Votre premier collaborateur{" "}
          <span className="text-brand">IA</span> pour les artisans du bâtiment.
        </h1>

        <p className="animate-in text-ink mx-auto mt-5 max-w-2xl font-serif text-xl font-medium text-pretty sm:text-2xl">
          L&apos;IA qui travaille pour votre entreprise.
        </p>

        <p className="animate-in text-muted mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-pretty">
          Créez vos devis, factures, contrats et documents en quelques secondes
          afin de vous concentrer sur votre métier.
        </p>

        <div className="animate-in mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href="/inscription" size="lg" className="w-full sm:w-auto">
            Essayer gratuitement
            <ArrowRight size={18} />
          </Button>
          <Button
            href="/#demo"
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <PlayCircle size={18} />
            Voir une démonstration
          </Button>
        </div>

        <p className="text-muted mt-5 text-sm">
          Sans engagement · Sans carte bancaire · Conçu pour les artisans
        </p>

        {/* Aperçu produit */}
        <div className="animate-in mx-auto mt-16 max-w-5xl">
          <div className="border-line bg-paper rounded-[1.75rem] border p-2 shadow-[var(--shadow-pop)]">
            <div className="bg-mist border-line overflow-hidden rounded-[1.4rem] border">
              <AppPreview />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Aperçu de l'application (mockup peuplé, sans capture externe). */
const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: FileText, label: "Devis & Factures" },
  { icon: Sparkles, label: "Assistant IA" },
  { icon: FolderClosed, label: "Documents" },
  { icon: ShieldCheck, label: "Coffre-fort" },
];
const STATS = [
  { label: "Chiffre d'affaires", value: "7 928 €" },
  { label: "Devis en cours", value: "5" },
  { label: "TVA collectée", value: "939 €" },
];
const ACTIVITY = [
  { icon: Receipt, ref: "FAC-2026-001", client: "M. Dupont", amount: "207,90 €" },
  { icon: FileText, ref: "DEV-2026-005", client: "M. Bernard", amount: "990,00 €" },
  { icon: Receipt, ref: "FAC-2026-002", client: "Mme Lefèvre", amount: "1 320 €" },
];
const BARS = [42, 64, 50, 82, 72, 100];

function AppPreview() {
  return (
    <div className="flex min-h-[300px] flex-col text-left sm:min-h-[440px]">
      {/* Barre fenêtre */}
      <div className="border-line flex items-center gap-2 border-b px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400/70" />
        <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
        <span className="h-3 w-3 rounded-full bg-green-400/70" />
        <span className="text-muted ml-3 text-xs">app.shiftoffice.app</span>
      </div>

      <div className="grid flex-1 grid-cols-12">
        {/* Sidebar */}
        <div className="border-line col-span-3 hidden flex-col border-r p-3 sm:flex">
          <div className="flex items-baseline gap-[0.15em] px-2 py-1.5 text-[13px] leading-none whitespace-nowrap">
            <span className="text-brand font-light">[&nbsp;]</span>
            <span className="text-brand font-extrabold tracking-[-0.02em]">
              Shift
            </span>
            <span className="text-ink font-serif font-medium">Office</span>
          </div>
          <div className="mt-4 space-y-0.5">
            {NAV.map((n) => (
              <div
                key={n.label}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium",
                  n.active ? "bg-mist text-ink" : "text-muted"
                )}
              >
                <n.icon
                  size={13}
                  className={n.active ? "text-brand" : "text-muted"}
                />
                <span className="truncate">{n.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div className="col-span-12 p-4 sm:col-span-9 sm:p-5">
          <p className="text-ink text-sm font-semibold tracking-tight">
            Bonjour, Plomberie Martin
          </p>

          {/* KPIs */}
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="border-line bg-paper rounded-xl border p-3 shadow-[var(--shadow-soft)]"
              >
                <p className="text-ink text-base font-semibold tracking-tight tabular">
                  {s.value}
                </p>
                <p className="text-muted mt-0.5 text-[10px] leading-tight">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Graphique */}
          <div className="border-line bg-paper mt-2.5 rounded-xl border p-3 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between">
              <p className="text-ink text-[11px] font-medium">
                Chiffre d&apos;affaires
              </p>
              <p className="text-muted text-[10px]">6 mois</p>
            </div>
            <div className="mt-3 flex h-16 items-end gap-1.5">
              {BARS.map((h, i) => (
                <div
                  key={i}
                  className="bg-brand/15 flex-1 overflow-hidden rounded-t"
                  style={{ height: `${h}%` }}
                >
                  <div className="bg-brand h-1 w-full rounded-t" />
                </div>
              ))}
            </div>
          </div>

          {/* Activité */}
          <div className="mt-2.5 hidden space-y-1.5 sm:block">
            {ACTIVITY.map((a) => (
              <div
                key={a.ref}
                className="border-line bg-paper flex items-center justify-between gap-2 rounded-lg border px-3 py-2 shadow-[var(--shadow-soft)]"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="bg-mist text-muted inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
                    <a.icon size={12} />
                  </span>
                  <span className="text-ink truncate text-[11px] font-medium">
                    {a.ref}
                    <span className="text-muted font-normal"> · {a.client}</span>
                  </span>
                </div>
                <span className="text-ink shrink-0 text-[11px] font-semibold tabular">
                  {a.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
