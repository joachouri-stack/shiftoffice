"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Plus,
  ArrowUp,
  Sparkles,
  FileText,
  Save,
  Printer,
  Receipt,
  Trash2,
  MessageSquare,
  Eye,
  History,
  Users,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/app/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { QuotePreview } from "@/components/devis/QuotePreview";
import { EmailModal, type EmailPayload } from "@/components/devis/EmailModal";
import { useCompanyProfile } from "@/lib/companyProfile";
import { useProducts } from "@/lib/products";
import { useClients } from "@/lib/clients";
import { useEmails } from "@/lib/emails";
import {
  useDraftQuote,
  useQuotes,
  computeTotals,
  emptyQuote,
  nextNumber,
  newId,
  formatEUR,
  type Quote,
} from "@/lib/quotes";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Prépare un devis pour une salle de bain de 6 m²",
  "Fais un devis pour remplacer une douche par une douche italienne",
  "Ajoute 20 m² de placo et la main-d'œuvre",
];

type Tab = "chat" | "preview" | "history";

export default function DevisFacturesPage() {
  const { profile } = useCompanyProfile();
  const { products } = useProducts();
  const { clients } = useClients();
  const { draft, setDraft } = useDraftQuote();
  const { quotes, save, remove } = useQuotes();
  const { record } = useEmails();
  const toast = useToast();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");
  const [emailOpen, setEmailOpen] = useState(false);
  const [chips, setChips] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setChips([]);
    setLoading(true);
    try {
      const res = await fetch("/api/assistant/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, profile, products }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.message || "…" },
      ]);
      setChips(Array.isArray(data.chips) ? data.chips : []);
      // Devis prêt : on applique les données générées au brouillon.
      if (data.complete && data.devis) {
        const d = data.devis;
        setDraft({
          ...draft,
          type: "devis",
          title: d.title || draft.title,
          clientName: d.clientName || draft.clientName,
          clientAddress: d.clientAddress || draft.clientAddress,
          lines: Array.isArray(d.lines) && d.lines.length ? d.lines : draft.lines,
        });
        setTab("preview");
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Une erreur est survenue. Réessayez." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function newDoc() {
    setDraft(emptyQuote());
    setMessages([]);
    setChips([]);
    setTab("chat");
  }

  function saveDoc() {
    let q = draft;
    if (!q.id) {
      const year = new Date().getFullYear();
      q = {
        ...q,
        id: newId(),
        number: nextNumber(quotes, q.type, year),
        createdAt: new Date().toISOString(),
      };
      setDraft(q);
    }
    save(q);
    toast(`${q.type === "facture" ? "Facture" : "Devis"} enregistré`);
  }

  function toInvoice() {
    const year = new Date().getFullYear();
    const invoice: Quote = {
      ...draft,
      id: newId(),
      type: "facture",
      number: nextNumber(quotes, "facture", year),
      createdAt: new Date().toISOString(),
      status: "sent",
      paymentTerms: draft.paymentTerms || "Paiement à 30 jours.",
    };
    save(invoice);
    setDraft(invoice);
    setTab("preview");
    toast(`Facture ${invoice.number} créée`);
  }

  function load(q: Quote) {
    setDraft(q);
    setMessages([]);
    setTab("preview");
  }

  // Renseigne l'en-tête du devis à partir d'un client du répertoire.
  function selectClient(id: string) {
    if (!id) {
      setDraft({ ...draft, clientName: "", clientAddress: "", clientEmail: "" });
      return;
    }
    const c = clients.find((x) => x.id === id);
    if (!c) return;
    const address = [c.address, [c.postalCode, c.city].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join("\n");
    setDraft({
      ...draft,
      clientName: c.name,
      clientAddress: address,
      clientEmail: c.email,
    });
  }

  // Client courant (rapproché par nom) pour la valeur du sélecteur.
  const currentClientId =
    clients.find((c) => c.name && c.name === draft.clientName)?.id ?? "";

  // Envoi email : enregistre le document, le marque « envoyé », historise.
  function sendEmail(payload: EmailPayload) {
    let q = draft;
    if (!q.id) {
      const year = new Date().getFullYear();
      q = {
        ...q,
        id: newId(),
        number: nextNumber(quotes, q.type, year),
        createdAt: new Date().toISOString(),
      };
    }
    q = { ...q, status: "sent" };
    save(q);
    setDraft(q);
    record({
      to: payload.to,
      toName: q.clientName,
      subject: payload.subject,
      body: payload.body,
      kind: q.type === "facture" ? "facture" : "devis",
      documentId: q.id,
      documentRef: q.number,
    });
    setEmailOpen(false);
    toast(`${q.type === "facture" ? "Facture" : "Devis"} marqué envoyé`);
  }

  const totals = computeTotals(draft);
  const hasDraft = draft.lines.length > 0 || draft.clientName || draft.title;

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] flex-col">
      <PageHeader
        title="Devis & Factures"
        subtitle="Décrivez votre chantier — l'IA construit le document."
        action={
          <Button size="sm" variant="outline" onClick={newDoc}>
            <Plus size={16} />
            Nouveau
          </Button>
        }
      />

      {/* Onglets mobile */}
      <div className="mb-4 flex gap-1 rounded-xl bg-mist p-1 lg:hidden">
        {(
          [
            ["chat", "Conversation", MessageSquare],
            ["preview", "Aperçu", Eye],
            ["history", "Historique", History],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors",
              tab === key ? "bg-paper text-ink shadow-[var(--shadow-soft)]" : "text-muted"
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-[210px_1fr_minmax(360px,420px)]">
        {/* Historique */}
        <aside
          className={cn(
            "min-h-0 flex-col",
            tab === "history" ? "flex" : "hidden",
            "lg:flex"
          )}
        >
          <p className="text-muted mb-2 px-1 text-xs font-semibold uppercase tracking-tight">
            Historique
          </p>
          <div className="border-line bg-paper flex-1 space-y-1 overflow-y-auto rounded-2xl border p-2">
            {quotes.length === 0 ? (
              <p className="text-muted p-4 text-center text-xs">
                Vos devis et factures enregistrés apparaîtront ici.
              </p>
            ) : (
              quotes.map((q) => (
                <div
                  key={q.id}
                  className="hover:bg-mist group flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors"
                >
                  <button
                    onClick={() => load(q)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="text-ink block truncate text-sm font-medium">
                      {q.number || "Brouillon"}
                    </span>
                    <span className="text-muted block truncate text-xs">
                      {q.clientName || q.title || "—"} ·{" "}
                      {formatEUR(computeTotals(q).totalTTC)} €
                    </span>
                  </button>
                  <Badge variant={q.type === "facture" ? "success" : "neutral"}>
                    {q.type === "facture" ? "Fac." : "Devis"}
                  </Badge>
                  <button
                    onClick={() => remove(q.id)}
                    aria-label="Supprimer"
                    className="text-muted opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Conversation */}
        <section
          className={cn(
            "min-h-0 flex-col",
            tab === "chat" ? "flex" : "hidden",
            "lg:flex"
          )}
        >
          <div
            ref={scrollRef}
            className="border-line bg-paper flex-1 overflow-y-auto rounded-2xl border p-4"
          >
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-6 text-center">
                <div className="bg-brand text-paper inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-[var(--shadow-brand)]">
                  <Sparkles size={26} />
                </div>
                <h2 className="text-ink mt-4 font-semibold tracking-tight">
                  Votre devis en quelques mots
                </h2>
                <p className="text-muted mt-1 max-w-xs text-sm">
                  Décrivez le chantier, l&apos;IA s&apos;occupe des lignes, prix
                  et TVA.
                </p>
                <div className="mt-5 w-full max-w-sm space-y-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="border-line bg-paper hover:border-brand/40 hover:bg-mist/50 flex w-full items-start gap-2 rounded-xl border p-3 text-left text-sm transition-all"
                    >
                      <FileText size={15} className="text-brand mt-0.5 shrink-0" />
                      <span className="text-ink">{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <Bubble key={i} msg={m} />
                ))}
                {loading && messages[messages.length - 1]?.role === "user" && (
                  <Bubble msg={{ role: "assistant", content: "…" }} pending />
                )}
              </div>
            )}
          </div>

          {/* Chips de réponse rapide */}
          {chips.length > 0 && !loading && (
            <div className="mt-3 flex flex-wrap gap-2">
              {chips.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => send(c)}
                  className="border-line bg-paper text-ink hover:border-brand/40 hover:bg-brand-50/50 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all"
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-line bg-paper mt-3 flex items-end gap-2 rounded-2xl border p-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Ex. Ajoute 2 m² de carrelage…"
              className="text-ink placeholder:text-muted/70 max-h-32 flex-1 resize-none bg-transparent px-2 py-2 text-[0.95rem] outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Envoyer"
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all",
                input.trim() && !loading
                  ? "bg-brand text-paper hover:bg-brand-600"
                  : "bg-mist text-muted"
              )}
            >
              <ArrowUp size={17} />
            </button>
          </form>
        </section>

        {/* Aperçu */}
        <section
          className={cn(
            "min-h-0 flex-col",
            tab === "preview" ? "flex" : "hidden",
            "lg:flex"
          )}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-ink text-sm font-semibold tabular">
              {formatEUR(totals.totalTTC)} € TTC
              {totals.margin > 0 && (
                <span className="text-muted ml-2 font-normal">
                  · marge {formatEUR(totals.margin)} €
                </span>
              )}
            </span>
            <div className="flex gap-1.5">
              <IconBtn label="Enregistrer" onClick={saveDoc} disabled={!hasDraft}>
                <Save size={16} />
              </IconBtn>
              <IconBtn
                label="Envoyer par email"
                onClick={() => setEmailOpen(true)}
                disabled={draft.lines.length === 0}
              >
                <Send size={16} />
              </IconBtn>
              <IconBtn
                label="Imprimer / PDF"
                onClick={() => window.print()}
                disabled={!hasDraft}
              >
                <Printer size={16} />
              </IconBtn>
              {draft.type === "devis" && (
                <IconBtn
                  label="Transformer en facture"
                  onClick={toInvoice}
                  disabled={draft.lines.length === 0}
                >
                  <Receipt size={16} />
                </IconBtn>
              )}
            </div>
          </div>
          {/* Sélecteur de client */}
          <div className="border-line bg-paper mb-2 flex items-center gap-2 rounded-xl border px-2.5 py-2">
            <Users size={16} className="text-muted shrink-0" />
            {clients.length === 0 ? (
              <span className="text-muted text-sm">
                Aucun client enregistré —{" "}
                <Link href="/clients" className="text-brand font-medium">
                  en ajouter un
                </Link>
              </span>
            ) : (
              <select
                value={currentClientId}
                onChange={(e) => selectClient(e.target.value)}
                className="text-ink w-full bg-transparent text-sm outline-none"
                aria-label="Client du document"
              >
                <option value="">
                  {draft.clientName
                    ? `${draft.clientName} (saisi manuellement)`
                    : "— Sélectionner un client —"}
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.city ? ` · ${c.city}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="border-line bg-mist/40 flex-1 overflow-auto rounded-2xl border p-3">
            <div className="bg-paper rounded-xl shadow-[var(--shadow-card)]">
              <QuotePreview quote={draft} profile={profile} />
            </div>
          </div>
        </section>
      </div>

      <EmailModal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        quote={draft}
        profile={profile}
        onSend={sendEmail}
      />
    </div>
  );
}

function Bubble({ msg, pending }: { msg: Msg; pending?: boolean }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-ink text-paper rounded-br-md"
            : "border-line bg-mist/40 text-ink rounded-bl-md border"
        )}
      >
        {pending ? <span className="text-muted">L&apos;IA réfléchit…</span> : msg.content}
      </div>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="border-line bg-paper text-ink hover:bg-mist inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:opacity-40"
    >
      {children}
    </button>
  );
}
