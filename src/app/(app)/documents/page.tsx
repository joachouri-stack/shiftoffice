"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus, FileText, Receipt, FolderClosed } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/app/PageHeader";
import { useQuotes, computeTotals, formatEUR, type DocType } from "@/lib/quotes";
import { statusMeta } from "@/lib/doc-status";
import { cn } from "@/lib/utils";

const FILTERS: { key: "all" | DocType; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "devis", label: "Devis" },
  { key: "facture", label: "Factures" },
];

export default function DocumentsPage() {
  const { quotes } = useQuotes();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | DocType>("all");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return quotes
      .filter((d) => (filter === "all" ? true : d.type === filter))
      .filter((d) =>
        !q
          ? true
          : [d.number, d.clientName, d.title]
              .join(" ")
              .toLowerCase()
              .includes(q)
      )
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [quotes, query, filter]);

  return (
    <>
      <PageHeader
        title="Documents"
        subtitle="Tous vos devis et factures, centralisés."
        action={
          <Button href="/devis-factures" size="sm">
            <Plus size={16} />
            Nouveau
          </Button>
        }
      />

      {/* Recherche + filtres */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="border-line bg-paper focus-within:border-brand focus-within:ring-brand/10 flex h-11 flex-1 items-center gap-2.5 rounded-xl border px-3.5 transition-all focus-within:ring-4">
          <Search size={18} className="text-muted shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un document, un client…"
            className="text-ink placeholder:text-muted/70 w-full bg-transparent text-[0.95rem] outline-none"
          />
        </div>
        <div className="bg-mist flex gap-1 rounded-xl p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f.key
                  ? "bg-paper text-ink shadow-[var(--shadow-soft)]"
                  : "text-muted hover:text-ink"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {quotes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
          <div className="bg-brand-50 text-brand inline-flex h-14 w-14 items-center justify-center rounded-2xl">
            <FolderClosed size={26} />
          </div>
          <h2 className="text-ink mt-5 text-xl font-semibold tracking-tight">
            Aucun document pour l&apos;instant
          </h2>
          <p className="text-muted mt-2 max-w-md text-[0.95rem]">
            Créez votre premier devis avec l&apos;assistant — il apparaîtra ici
            automatiquement.
          </p>
          <Button href="/devis-factures" className="mt-6">
            <Plus size={16} />
            Créer un devis
          </Button>
        </Card>
      ) : (
        <Card className="divide-line divide-y">
          {list.map((d) => {
            const isInvoice = d.type === "facture";
            return (
              <Link
                key={d.id}
                href="/devis-factures"
                className="hover:bg-mist/50 flex items-center justify-between gap-3 px-4 py-3.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="bg-mist text-muted inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    {isInvoice ? <Receipt size={18} /> : <FileText size={18} />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-ink truncate text-sm font-medium">
                      {d.number || "Brouillon"}
                      {d.clientName ? ` · ${d.clientName}` : ""}
                    </p>
                    <p className="text-muted truncate text-xs">
                      {d.title || "—"}
                      {d.createdAt
                        ? ` · ${new Date(d.createdAt).toLocaleDateString("fr-FR")}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-ink text-sm font-semibold tabular whitespace-nowrap">
                    {formatEUR(computeTotals(d).totalTTC)} €
                  </span>
                  <Badge variant={statusMeta(d.status, d.type).variant}>
                    {statusMeta(d.status, d.type).label}
                  </Badge>
                </div>
              </Link>
            );
          })}
          {list.length === 0 && (
            <p className="text-muted px-5 py-10 text-center text-sm">
              Aucun résultat pour ces critères.
            </p>
          )}
        </Card>
      )}
    </>
  );
}
