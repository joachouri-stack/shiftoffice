"use client";

import Link from "next/link";
import {
  Sparkles,
  FileText,
  Receipt,
  TrendingUp,
  Percent,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/app/PageHeader";
import { useCompanyProfile } from "@/lib/companyProfile";
import { useQuotes, computeTotals, formatEUR, type Quote } from "@/lib/quotes";

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

export default function DashboardPage() {
  const { profile } = useCompanyProfile();
  const { quotes } = useQuotes();

  const invoices = quotes.filter((q) => q.type === "facture");
  const devis = quotes.filter((q) => q.type === "devis");

  const ca = invoices.reduce((s, q) => s + computeTotals(q).totalTTC, 0);
  const profit = invoices.reduce((s, q) => s + computeTotals(q).margin, 0);
  const tva = invoices.reduce((s, q) => s + computeTotals(q).totalTVA, 0);

  // CA des 6 derniers mois
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("fr-FR", { month: "short" }),
      value: 0,
    };
  });
  for (const inv of invoices) {
    if (!inv.createdAt) continue;
    const m = months.find((x) => x.key === monthKey(inv.createdAt));
    if (m) m.value += computeTotals(inv).totalTTC;
  }
  const maxMonth = Math.max(1, ...months.map((m) => m.value));

  const recent = [...quotes]
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 5);

  const stats = [
    {
      icon: TrendingUp,
      label: "Chiffre d'affaires",
      value: `${formatEUR(ca)} €`,
      sub: `${invoices.length} facture${invoices.length > 1 ? "s" : ""}`,
    },
    {
      icon: Sparkles,
      label: "Bénéfices estimés",
      value: `${formatEUR(profit)} €`,
      sub: "marge sur factures",
    },
    {
      icon: Percent,
      label: "TVA collectée",
      value: `${formatEUR(tva)} €`,
      sub: "à reverser",
    },
    {
      icon: FileText,
      label: "Devis en cours",
      value: String(devis.length),
      sub: "à suivre",
    },
  ];

  const greeting = profile.name ? `Bonjour, ${profile.name}` : "Bonjour 👋";

  return (
    <>
      <PageHeader
        title={greeting}
        subtitle="Voici votre activité en un coup d'œil."
        action={
          <Button href="/devis-factures" size="sm">
            <Plus size={16} />
            Nouveau devis
          </Button>
        }
      />

      {/* Stats */}
      <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} interactive className="p-5">
            <div className="bg-brand-50 text-brand inline-flex h-10 w-10 items-center justify-center rounded-xl">
              <s.icon size={18} />
            </div>
            <p className="text-ink mt-4 text-2xl font-semibold tracking-tight tabular">
              {s.value}
            </p>
            <p className="text-ink mt-0.5 text-sm font-medium">{s.label}</p>
            <p className="text-muted text-xs">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Graphique + activité */}
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="reveal p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-ink font-semibold tracking-tight">
                Chiffre d&apos;affaires
              </h2>
              <p className="text-muted text-sm">6 derniers mois</p>
            </div>
            <Badge variant="neutral">{formatEUR(ca)} €</Badge>
          </div>
          <div className="mt-6">
            <div className="flex h-40 items-end justify-between gap-2 sm:gap-4">
              {months.map((m) => (
                <div
                  key={m.key}
                  className="bg-brand/15 hover:bg-brand/25 flex-1 overflow-hidden rounded-t-lg transition-all duration-300"
                  style={{
                    height: `${Math.max(3, (m.value / maxMonth) * 100)}%`,
                  }}
                  title={`${formatEUR(m.value)} €`}
                >
                  <div className="bg-brand h-1.5 w-full rounded-t-lg" />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between gap-2 sm:gap-4">
              {months.map((m) => (
                <span
                  key={m.key}
                  className="text-muted flex-1 text-center text-xs capitalize"
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <Card className="reveal divide-line flex flex-col divide-y p-0 lg:col-span-2">
          <div className="flex items-center justify-between p-5">
            <h2 className="text-ink font-semibold tracking-tight">
              Activité récente
            </h2>
            <Link
              href="/devis-factures"
              className="text-brand hover:text-brand-600 text-sm font-medium"
            >
              Tout voir
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-muted flex-1 px-5 py-10 text-center text-sm">
              Aucun document pour l&apos;instant.
              <br />
              Créez votre premier devis avec l&apos;assistant.
            </p>
          ) : (
            recent.map((q) => <RecentRow key={q.id} q={q} />)
          )}
        </Card>
      </div>

      {/* Assistant */}
      <Card className="reveal bg-ink relative mt-4 overflow-hidden p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(40% 80% at 100% 0%, rgba(255,107,43,0.3) 0%, transparent 70%)",
          }}
        />
        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="bg-brand text-paper inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-paper text-lg font-semibold">
                Créez un devis en quelques mots
              </h2>
              <p className="mt-1 max-w-md text-sm text-white/70">
                Décrivez votre chantier, l&apos;IA construit le document. Trois
                clics, c&apos;est prêt.
              </p>
            </div>
          </div>
          <Button href="/devis-factures" className="shrink-0">
            Ouvrir l&apos;assistant
            <ArrowUpRight size={17} />
          </Button>
        </div>
      </Card>
    </>
  );
}

function RecentRow({ q }: { q: Quote }) {
  const isInvoice = q.type === "facture";
  return (
    <Link
      href="/devis-factures"
      className="hover:bg-mist/50 flex items-center justify-between gap-3 px-5 py-3.5 transition-colors last:rounded-b-2xl"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="bg-mist text-muted inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          {isInvoice ? <Receipt size={16} /> : <FileText size={16} />}
        </span>
        <div className="min-w-0">
          <p className="text-ink truncate text-sm font-medium">
            {q.number || "Brouillon"}
          </p>
          <p className="text-muted truncate text-xs">
            {q.clientName || q.title || "—"}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-ink text-sm font-semibold tabular">
          {formatEUR(computeTotals(q).totalTTC)} €
        </span>
        <Badge variant={isInvoice ? "success" : "neutral"}>
          {isInvoice ? "Fac." : "Devis"}
        </Badge>
      </div>
    </Link>
  );
}
