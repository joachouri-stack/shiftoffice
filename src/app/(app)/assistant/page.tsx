"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  ArrowUp,
  FileText,
  Calculator,
  ListChecks,
  MessageSquare,
  PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/app/PageHeader";
import { FormattedMessage } from "@/components/app/FormattedMessage";
import { useCompanyProfile } from "@/lib/companyProfile";
import { useAssistantChat } from "@/lib/assistantChat";
import type { ChatMessage } from "@/lib/assistant";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  { icon: FileText, text: "Rédige un devis pour une salle de bain de 6 m²" },
  { icon: Calculator, text: "Calcule ma TVA à 10 % sur un chantier de 4 800 €" },
  { icon: PenLine, text: "Réponds à un client qui trouve mon devis trop cher" },
  { icon: ListChecks, text: "Organise mes tâches de chantier de la semaine" },
];

export default function AssistantPage() {
  const { profile } = useCompanyProfile();
  const { messages, commit, clear } = useAssistantChat();
  const [streaming, setStreaming] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const buffer = useRef("");

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streaming]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || streaming !== null) return;
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    commit(next);
    setInput("");
    setStreaming("");
    buffer.current = "";
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.body) throw new Error("no body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer.current += decoder.decode(value, { stream: true });
        setStreaming(buffer.current);
      }
      commit([...next, { role: "assistant", content: buffer.current }]);
    } catch {
      commit([
        ...next,
        {
          role: "assistant",
          content: "Une erreur est survenue. Réessayez dans un instant.",
        },
      ]);
    } finally {
      setStreaming(null);
    }
  }

  const empty = messages.length === 0 && streaming === null;
  const firstName = profile.name || "";

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col">
      <PageHeader
        title="Assistant IA"
        subtitle="Votre collaborateur, spécialiste du bâtiment."
        action={
          messages.length > 0 ? (
            <Button variant="outline" size="sm" onClick={clear}>
              <MessageSquare size={15} />
              Nouvelle conversation
            </Button>
          ) : undefined
        }
      />

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center">
            <div className="bg-brand text-paper reveal-scale inline-flex h-16 w-16 items-center justify-center rounded-[1.4rem] shadow-[var(--shadow-brand)]">
              <Sparkles size={30} />
            </div>
            <h2 className="text-ink reveal mt-6 text-2xl font-semibold tracking-tight">
              {firstName ? `Bonjour ${firstName} 👋` : "Bonjour 👋"}
            </h2>
            <p className="text-muted reveal mt-2 max-w-md text-[0.95rem]">
              Je suis votre collaborateur. Devis, factures, TVA, réponses
              clients… dites-moi simplement ce dont vous avez besoin.
            </p>

            <div className="stagger mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  type="button"
                  onClick={() => send(s.text)}
                  className="border-line bg-paper hover:border-brand/40 hover:bg-mist/50 flex items-start gap-3 rounded-2xl border p-4 text-left transition-all active:scale-[0.99]"
                >
                  <span className="bg-brand-50 text-brand inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    <s.icon size={16} />
                  </span>
                  <span className="text-ink text-sm font-medium leading-snug">
                    {s.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-5 py-2">
            {messages.map((m, i) => (
              <Row key={i} message={m} />
            ))}
            {streaming !== null && (
              <Row message={{ role: "assistant", content: streaming }} pending />
            )}
          </div>
        )}
      </div>

      {/* Saisie */}
      <div className="mt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-line bg-paper focus-within:border-brand/40 focus-within:ring-brand/10 mx-auto flex max-w-2xl items-end gap-2 rounded-2xl border p-2 shadow-[var(--shadow-soft)] transition-all focus-within:ring-4"
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
            placeholder="Écrivez votre message…"
            className="text-ink placeholder:text-muted/70 max-h-40 flex-1 resize-none bg-transparent px-3 py-2.5 text-[0.95rem] outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming !== null}
            aria-label="Envoyer"
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all active:scale-95",
              input.trim() && streaming === null
                ? "bg-brand text-paper hover:bg-brand-600"
                : "bg-mist text-muted"
            )}
          >
            <ArrowUp size={18} />
          </button>
        </form>
        <p className="text-muted mx-auto mt-3 max-w-2xl text-center text-xs">
          L&apos;assistant peut se tromper. Vérifiez les montants et documents
          importants.
        </p>
      </div>
    </div>
  );
}

function Row({
  message,
  pending = false,
}: {
  message: ChatMessage;
  pending?: boolean;
}) {
  const isUser = message.role === "user";
  if (isUser) {
    return (
      <div className="reveal flex justify-end">
        <div className="bg-ink text-paper max-w-[85%] rounded-2xl rounded-br-md px-4 py-3 text-[0.95rem] leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="reveal flex items-start gap-3">
      <span className="bg-brand text-paper mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-[var(--shadow-brand)]">
        <Sparkles size={16} />
      </span>
      <div className="border-line bg-paper text-ink min-w-0 flex-1 rounded-2xl rounded-tl-md border px-4 py-3 text-[0.95rem] leading-relaxed shadow-[var(--shadow-soft)]">
        {pending && message.content === "" ? (
          <span className="text-muted inline-flex gap-1">
            <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
          </span>
        ) : (
          <FormattedMessage content={message.content} />
        )}
      </div>
    </div>
  );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="bg-muted/60 inline-block h-2 w-2 animate-bounce rounded-full"
      style={{ animationDelay: delay }}
    />
  );
}
