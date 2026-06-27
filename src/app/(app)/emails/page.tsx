"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Mail, Send, FileText, Receipt } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/app/PageHeader";
import { useEmails, type SentEmail } from "@/lib/emails";

const KIND_LABEL: Record<string, string> = {
  devis: "Devis",
  facture: "Facture",
  relance: "Relance",
  email_pro: "Email",
};

export default function EmailsPage() {
  const { emails } = useEmails();
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return emails
      .filter((e) =>
        !q
          ? true
          : [e.subject, e.to, e.toName, e.documentRef]
              .join(" ")
              .toLowerCase()
              .includes(q)
      )
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [emails, query]);

  return (
    <>
      <PageHeader
        title="Emails"
        subtitle="L'historique de tous vos envois à vos clients."
      />

      {emails.length > 0 && (
        <div className="mb-5">
          <div className="border-line bg-paper focus-within:border-brand focus-within:ring-brand/10 flex h-11 items-center gap-2.5 rounded-xl border px-3.5 transition-all focus-within:ring-4">
            <Search size={18} className="text-muted shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par objet, client, document…"
              className="text-ink placeholder:text-muted/70 w-full bg-transparent text-[0.95rem] outline-none"
            />
          </div>
        </div>
      )}

      {emails.length === 0 ? (
        <Card className="flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
          <div className="bg-brand-50 text-brand inline-flex h-14 w-14 items-center justify-center rounded-2xl">
            <Mail size={26} />
          </div>
          <h2 className="text-ink mt-5 text-xl font-semibold tracking-tight">
            Aucun email envoyé
          </h2>
          <p className="text-muted mt-2 max-w-md text-[0.95rem]">
            Depuis un devis ou une facture, utilisez « Envoyer par email » :
            vos envois apparaîtront ici.
          </p>
        </Card>
      ) : (
        <Card className="divide-line divide-y">
          {list.map((e) => (
            <EmailRow key={e.id} email={e} />
          ))}
          {list.length === 0 && (
            <p className="text-muted px-5 py-10 text-center text-sm">
              Aucun email ne correspond à « {query} ».
            </p>
          )}
        </Card>
      )}
    </>
  );
}

function EmailRow({ email }: { email: SentEmail }) {
  const isInvoice = email.kind === "facture";
  return (
    <Link
      href="/devis-factures"
      className="hover:bg-mist/50 flex items-start gap-3 px-4 py-3.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl sm:px-5"
    >
      <span className="bg-brand-50 text-brand inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
        <Send size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-ink truncate text-sm font-medium">{email.subject}</p>
        <p className="text-muted truncate text-xs">
          {email.toName ? `${email.toName} · ` : ""}
          {email.to}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge variant={isInvoice ? "success" : "neutral"}>
          {isInvoice ? (
            <Receipt size={11} />
          ) : (
            <FileText size={11} />
          )}
          {KIND_LABEL[email.kind] ?? "Email"}
        </Badge>
        <span className="text-muted text-xs whitespace-nowrap">
          {email.createdAt
            ? new Date(email.createdAt).toLocaleDateString("fr-FR")
            : ""}
        </span>
      </div>
    </Link>
  );
}
