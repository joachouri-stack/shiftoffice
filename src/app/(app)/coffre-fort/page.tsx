"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ShieldCheck,
  Lock,
  FileText,
  Receipt,
  FileSignature,
  Wallet,
  ScrollText,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/app/PageHeader";
import { useQuotes, computeTotals, formatEUR, type Quote } from "@/lib/quotes";

const COMING = [
  { icon: FileSignature, label: "Contrats" },
  { icon: Wallet, label: "Fiches de paie" },
  { icon: ScrollText, label: "Quittances" },
];

export default function CoffreFortPage() {
  const { quotes } = useQuotes();
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const match = (d: Quote) =>
    !q ||
    [d.number, d.clientName, d.title].join(" ").toLowerCase().includes(q);

  const devis = useMemo(
    () => quotes.filter((d) => d.type === "devis" && match(d)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quotes, q]
  );
  const factures = useMemo(
    () => quotes.filter((d) => d.type === "facture" && match(d)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quotes, q]
  );

  return (
    <>
      <PageHeader
        title="Coffre-fort"
        subtitle="Tous vos documents, chiffrés et retrouvés en un instant."
      />

      {/* Bannière sécurité */}
      <Card className="bg-ink relative mb-5 overflow-hidden p-5 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(45% 90% at 0% 0%, rgba(255,107,43,0.25) 0%, transparent 70%)",
          }}
        />
        <div className="relative flex items-center gap-4">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-paper">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-paper font-semibold">Espace sécurisé</p>
            <p className="mt-0.5 text-sm text-white/70">
              Chiffrement de bout en bout. Vous seul y avez accès.
            </p>
          </div>
        </div>
      </Card>

      {/* Recherche */}
      <div className="border-line bg-paper focus-within:border-brand focus-within:ring-brand/10 mb-6 flex h-12 items-center gap-2.5 rounded-2xl border px-4 shadow-[var(--shadow-soft)] transition-all focus-within:ring-4">
        <Search size={19} className="text-muted shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher dans le coffre-fort…"
          className="text-ink placeholder:text-muted/70 w-full bg-transparent text-base outline-none"
        />
      </div>

      {quotes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="bg-brand-50 text-brand inline-flex h-14 w-14 items-center justify-center rounded-2xl">
            <Lock size={24} />
          </div>
          <h2 className="text-ink mt-5 text-xl font-semibold tracking-tight">
            Votre coffre-fort est vide
          </h2>
          <p className="text-muted mt-2 max-w-md text-[0.95rem]">
            Vos devis, factures et documents enregistrés y seront classés et
            sécurisés automatiquement.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          <VaultGroup title="Devis" icon={FileText} items={devis} />
          <VaultGroup title="Factures" icon={Receipt} items={factures} />
        </div>
      )}

      {/* À venir */}
      <div className="mt-8">
        <p className="text-muted mb-3 px-1 text-xs font-semibold uppercase tracking-tight">
          Bientôt dans votre coffre
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {COMING.map((c) => (
            <Card
              key={c.label}
              className="flex items-center gap-3 p-4 opacity-70"
            >
              <span className="bg-mist text-muted inline-flex h-10 w-10 items-center justify-center rounded-xl">
                <c.icon size={18} />
              </span>
              <div>
                <p className="text-ink text-sm font-medium">{c.label}</p>
                <p className="text-muted text-xs">Bientôt disponible</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

function VaultGroup({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  items: Quote[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 px-1">
        <Icon size={16} className="text-muted" />
        <h2 className="text-ink text-sm font-semibold tracking-tight">
          {title}
        </h2>
        <span className="text-muted text-xs">({items.length})</span>
      </div>
      <Card className="divide-line divide-y">
        {items.map((d) => (
          <Link
            key={d.id}
            href="/devis-factures"
            className="hover:bg-mist/50 flex items-center justify-between gap-3 px-4 py-3.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl sm:px-5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="bg-brand-50 text-brand inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                <Lock size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-ink truncate text-sm font-medium">
                  {d.number || "Brouillon"}
                  {d.clientName ? ` · ${d.clientName}` : ""}
                </p>
                <p className="text-muted truncate text-xs">
                  {d.createdAt
                    ? new Date(d.createdAt).toLocaleDateString("fr-FR")
                    : "—"}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-ink text-sm font-semibold tabular whitespace-nowrap">
                {formatEUR(computeTotals(d).totalTTC)} €
              </span>
              <Badge variant="neutral">
                <Lock size={11} />
                Chiffré
              </Badge>
            </div>
          </Link>
        ))}
      </Card>
    </div>
  );
}
