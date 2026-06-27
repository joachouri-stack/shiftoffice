"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  UserRound,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Receipt,
  Send,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useClients } from "@/lib/clients";
import { useQuotes, computeTotals, formatEUR, type Quote } from "@/lib/quotes";
import { useEmails } from "@/lib/emails";

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const { clients } = useClients();
  const { quotes } = useQuotes();
  const { emails } = useEmails();

  const client = clients.find((c) => c.id === params.id) ?? null;

  const docs = useMemo(() => {
    if (!client) return [];
    return quotes
      .filter((q) => q.clientName && q.clientName === client.name)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [quotes, client]);

  const clientEmails = useMemo(() => {
    if (!client) return [];
    return emails
      .filter(
        (e) =>
          (e.toName && e.toName === client.name) ||
          (client.email && e.to === client.email)
      )
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [emails, client]);

  if (!client) {
    return (
      <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-ink text-lg font-semibold">Client introuvable</p>
        <p className="text-muted mt-1 text-sm">
          Ce client n&apos;existe pas ou a été supprimé.
        </p>
        <Button href="/clients" variant="outline" className="mt-5">
          <ArrowLeft size={16} />
          Retour aux clients
        </Button>
      </Card>
    );
  }

  const pro = client.type === "professionnel";
  const ca = docs
    .filter((q) => q.type === "facture")
    .reduce((s, q) => s + computeTotals(q).totalTTC, 0);

  const contact = [
    client.email && { icon: Mail, value: client.email },
    client.phone && { icon: Phone, value: client.phone },
    (client.address || client.city) && {
      icon: MapPin,
      value: [client.address, [client.postalCode, client.city].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", "),
    },
  ].filter(Boolean) as { icon: typeof Mail; value: string }[];

  return (
    <>
      <Link
        href="/clients"
        className="text-muted hover:text-ink mb-4 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
      >
        <ArrowLeft size={16} />
        Tous les clients
      </Link>

      {/* En-tête client */}
      <Card className="p-6 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span
              className={
                "inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl " +
                (pro ? "bg-ink/5 text-ink" : "bg-brand-50 text-brand")
              }
            >
              {pro ? <Building2 size={26} /> : <UserRound size={26} />}
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-ink text-xl font-semibold tracking-tight">
                  {client.name}
                </h1>
                <Badge variant="neutral">{pro ? "Pro" : "Particulier"}</Badge>
              </div>
              {client.siret && (
                <p className="text-muted mt-0.5 text-sm">SIRET {client.siret}</p>
              )}
            </div>
          </div>
          <Button href="/devis-factures" size="sm" className="shrink-0">
            <Plus size={16} />
            Nouveau devis
          </Button>
        </div>

        {contact.length > 0 && (
          <div className="border-line mt-5 grid gap-3 border-t pt-5 sm:grid-cols-3">
            {contact.map((c) => (
              <div key={c.value} className="flex items-center gap-2.5">
                <span className="bg-mist text-muted inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <c.icon size={16} />
                </span>
                <span className="text-ink min-w-0 truncate text-sm">{c.value}</span>
              </div>
            ))}
          </div>
        )}

        {client.notes && (
          <p className="text-muted bg-mist/50 mt-4 rounded-xl p-3 text-sm">
            {client.notes}
          </p>
        )}
      </Card>

      {/* Stats rapides */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <MiniStat label="Documents" value={String(docs.length)} />
        <MiniStat
          label="Factures"
          value={String(docs.filter((q) => q.type === "facture").length)}
        />
        <MiniStat label="CA facturé" value={`${formatEUR(ca)} €`} />
      </div>

      {/* Devis & factures du client */}
      <h2 className="text-ink mt-8 mb-3 text-sm font-semibold tracking-tight">
        Devis & factures
      </h2>
      {docs.length === 0 ? (
        <Card className="text-muted px-6 py-10 text-center text-sm">
          Aucun document pour ce client.{" "}
          <Link href="/devis-factures" className="text-brand font-medium">
            Créer un devis
          </Link>
        </Card>
      ) : (
        <Card className="divide-line divide-y">
          {docs.map((q) => (
            <DocRow key={q.id} q={q} />
          ))}
        </Card>
      )}

      {/* Emails envoyés */}
      {clientEmails.length > 0 && (
        <>
          <h2 className="text-ink mt-8 mb-3 text-sm font-semibold tracking-tight">
            Emails envoyés
          </h2>
          <Card className="divide-line divide-y">
            {clientEmails.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <span className="bg-mist text-muted inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <Send size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink truncate text-sm font-medium">
                    {e.subject}
                  </p>
                  <p className="text-muted truncate text-xs">{e.to}</p>
                </div>
                <span className="text-muted shrink-0 text-xs">
                  {e.createdAt
                    ? new Date(e.createdAt).toLocaleDateString("fr-FR")
                    : ""}
                </span>
              </div>
            ))}
          </Card>
        </>
      )}
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-ink text-2xl font-semibold tracking-tight tabular">
        {value}
      </p>
      <p className="text-muted mt-0.5 text-sm">{label}</p>
    </Card>
  );
}

function DocRow({ q }: { q: Quote }) {
  const isInvoice = q.type === "facture";
  return (
    <Link
      href="/devis-factures"
      className="hover:bg-mist/50 flex items-center justify-between gap-3 px-4 py-3.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl sm:px-5"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="bg-brand-50 text-brand inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          {isInvoice ? <Receipt size={16} /> : <FileText size={16} />}
        </span>
        <div className="min-w-0">
          <p className="text-ink truncate text-sm font-medium">
            {q.number || "Brouillon"}
          </p>
          <p className="text-muted truncate text-xs">
            {q.title || "—"} ·{" "}
            {q.createdAt
              ? new Date(q.createdAt).toLocaleDateString("fr-FR")
              : "—"}
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
