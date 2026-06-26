"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  ArrowUp,
  FileText,
  Calculator,
  ListChecks,
  MessageSquare,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/app/PageHeader";
import type { ChatMessage } from "@/lib/assistant";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  { icon: FileText, text: "Prépare un devis pour une salle de bain de 6 m²" },
  { icon: Calculator, text: "Calcule la TVA à 10 % sur un chantier de 4 800 €" },
  { icon: MessageSquare, text: "Réponds à un client qui trouve mon devis trop cher" },
  { icon: ListChecks, text: "Organise mes tâches de chantier de la semaine" },
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.body) throw new Error("no body");

      // Ajoute un message assistant vide qu'on remplit au fil du flux.
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) =>
          m.map((msg, i) =>
            i === m.length - 1
              ? { role: "assistant", content: msg.content + chunk }
              : msg
          )
        );
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Une erreur est survenue. Réessayez dans un instant.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col">
      <PageHeader
        title="Assistant IA"
        subtitle="Votre collaborateur intelligent, spécialisé bâtiment."
      />

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center">
            <div className="bg-brand text-paper inline-flex h-16 w-16 items-center justify-center rounded-3xl shadow-[var(--shadow-brand)]">
              <Sparkles size={30} />
            </div>
            <h2 className="text-ink mt-6 text-xl font-semibold tracking-tight">
              Comment puis-je vous aider ?
            </h2>
            <p className="text-muted mt-2 max-w-md text-[0.95rem]">
              Posez votre question ou choisissez une suggestion pour démarrer.
            </p>

            <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  type="button"
                  onClick={() => send(s.text)}
                  className="border-line bg-paper hover:border-brand/40 hover:bg-mist/50 flex items-start gap-3 rounded-2xl border p-4 text-left transition-all"
                >
                  <s.icon size={18} className="text-brand mt-0.5 shrink-0" />
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
              <MessageBubble key={i} message={m} />
            ))}
            {loading &&
              messages[messages.length - 1]?.role === "user" && (
                <MessageBubble message={{ role: "assistant", content: "" }} pending />
              )}
          </div>
        )}
      </div>

      {/* Saisie */}
      <div className="bg-mist/40 sticky bottom-0 pt-4">
        <Card className="mx-auto max-w-2xl p-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2"
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
              disabled={!input.trim() || loading}
              aria-label="Envoyer"
              className={cn(
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all",
                input.trim() && !loading
                  ? "bg-brand text-paper hover:bg-brand-600"
                  : "bg-mist text-muted"
              )}
            >
              <ArrowUp size={18} />
            </button>
          </form>
        </Card>
        <p className="text-muted py-3 text-center text-xs">
          L&apos;assistant peut se tromper. Vérifiez les montants et documents
          importants.
        </p>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  pending = false,
}: {
  message: ChatMessage;
  pending?: boolean;
}) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-[0.95rem] leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-ink text-paper rounded-br-md"
            : "border-line bg-paper text-ink rounded-bl-md border shadow-[var(--shadow-soft)]"
        )}
      >
        {pending || (!isUser && message.content === "") ? (
          <span className="text-muted inline-flex gap-1">
            <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
          </span>
        ) : (
          message.content
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
