"use client";

import { useEffect, useState } from "react";
import { Paperclip, RefreshCw, Send, Info } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { computeTotals, formatEUR, type Quote } from "@/lib/quote-core";
import type { CompanyProfile } from "@/lib/companyProfile";

export type EmailPayload = { to: string; subject: string; body: string };

export function EmailModal({
  open,
  onClose,
  quote,
  profile,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  quote: Quote;
  profile: CompanyProfile;
  onSend: (payload: EmailPayload) => void;
}) {
  const isInvoice = quote.type === "facture";
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Envoyer ${isInvoice ? "la facture" : "le devis"}${
        quote.number ? ` ${quote.number}` : ""
      }`}
    >
      {/* Monté uniquement à l'ouverture (Modal renvoie null si fermé) :
          l'état se réinitialise et la génération IA se lance à chaque ouverture. */}
      <EmailComposer
        quote={quote}
        profile={profile}
        onSend={onSend}
        onClose={onClose}
      />
    </Modal>
  );
}

function EmailComposer({
  quote,
  profile,
  onSend,
  onClose,
}: {
  quote: Quote;
  profile: CompanyProfile;
  onSend: (payload: EmailPayload) => void;
  onClose: () => void;
}) {
  const isInvoice = quote.type === "facture";
  const totalTTC = formatEUR(computeTotals(quote).totalTTC);

  const [to, setTo] = useState(quote.clientEmail || "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [generating, setGenerating] = useState(true); // génère au montage

  // Appel réseau : les setState ont lieu APRÈS await (hors corps synchrone d'effet).
  async function runGenerate(active: () => boolean = () => true) {
    try {
      const res = await fetch("/api/email/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: isInvoice ? "facture" : "devis",
          documentRef: quote.number,
          clientName: quote.clientName,
          companyName: profile.name,
          senderName: profile.name,
          totalTTC,
          title: quote.title,
        }),
      });
      const data = await res.json();
      if (!active()) return;
      if (data.subject) setSubject(data.subject);
      if (data.body) setBody(data.body);
    } catch {
      // échec réseau : on laisse les champs à compléter à la main
    } finally {
      if (active()) setGenerating(false);
    }
  }

  useEffect(() => {
    let alive = true;
    // Les setState de runGenerate sont asynchrones (après await fetch) :
    // pas de cascade de rendus, on désactive donc la règle pour cet appel.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runGenerate(() => alive);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function regenerate() {
    setGenerating(true);
    runGenerate();
  }

  const canSend =
    to.trim() !== "" && subject.trim() !== "" && body.trim() !== "";

  return (
    <div className="space-y-4">
      <Input
        label="Destinataire"
        type="email"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        placeholder="client@email.fr"
      />

      <Input
        label="Objet"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Objet de l'email"
      />

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-ink text-sm font-medium">Message</label>
          <button
            type="button"
            onClick={regenerate}
            disabled={generating}
            className="text-brand hover:text-brand-600 inline-flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={generating ? "animate-spin" : ""} />
            {generating ? "Génération…" : "Régénérer par l'IA"}
          </button>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          placeholder={
            generating ? "L'IA rédige votre message…" : "Votre message…"
          }
          className="border-line bg-paper text-ink placeholder:text-muted/70 focus:border-brand focus:ring-brand/10 w-full resize-none rounded-xl border px-4 py-3 text-[0.95rem] leading-relaxed outline-none transition-all focus:ring-4"
        />
      </div>

      {/* Pièce jointe */}
      <div className="border-line bg-mist/40 flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5">
        <span className="bg-brand-50 text-brand inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
          <Paperclip size={15} />
        </span>
        <div className="min-w-0">
          <p className="text-ink truncate text-sm font-medium">
            {(quote.number || (isInvoice ? "facture" : "devis")) + ".pdf"}
          </p>
          <p className="text-muted text-xs">Joint automatiquement</p>
        </div>
        <span className="text-muted ml-auto text-sm font-semibold tabular">
          {totalTTC} €
        </span>
      </div>

      {/* Note Resend */}
      <div className="text-muted flex items-start gap-2 text-xs">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>
          L&apos;envoi réel (Resend) sera activé à la connexion du backend. Pour
          l&apos;instant, le document est marqué « envoyé » et ajouté à votre
          historique.
        </span>
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button
          type="button"
          onClick={() => onSend({ to, subject, body })}
          disabled={!canSend}
        >
          <Send size={16} />
          Envoyer
        </Button>
      </div>
    </div>
  );
}
