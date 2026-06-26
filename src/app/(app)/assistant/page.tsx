"use client";

import { useState } from "react";
import { Sparkles, ArrowUp, FileText, Calculator, ListChecks } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/app/PageHeader";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  { icon: FileText, text: "Rédige un devis pour une salle de bain" },
  { icon: Calculator, text: "Calcule ma TVA sur ce chantier" },
  { icon: ListChecks, text: "Organise mes tâches de la semaine" },
];

export default function AssistantPage() {
  const [value, setValue] = useState("");

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col">
      <PageHeader
        title="Assistant IA"
        subtitle="Votre assistant intelligent, prêt à vous faire gagner du temps."
      />

      {/* Zone conversation */}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="bg-brand text-paper inline-flex h-16 w-16 items-center justify-center rounded-3xl shadow-[var(--shadow-brand)]">
          <Sparkles size={30} />
        </div>
        <h2 className="text-ink mt-6 text-xl font-semibold tracking-tight">
          Comment puis-je vous aider ?
        </h2>
        <p className="text-muted mt-2 max-w-md text-[0.95rem]">
          Posez votre question ou choisissez une suggestion pour démarrer.
        </p>

        <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.text}
              type="button"
              onClick={() => setValue(s.text)}
              className="border-line bg-paper hover:border-brand/40 hover:bg-mist/50 flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all"
            >
              <s.icon size={18} className="text-brand" />
              <span className="text-ink text-sm font-medium leading-snug">
                {s.text}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Barre de saisie */}
      <Card className="mt-6 p-2">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex items-end gap-2"
        >
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={1}
            placeholder="Écrivez votre message…"
            className="text-ink placeholder:text-muted/70 max-h-40 flex-1 resize-none bg-transparent px-3 py-2.5 text-[0.95rem] outline-none"
          />
          <button
            type="submit"
            disabled={!value.trim()}
            aria-label="Envoyer"
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all",
              value.trim()
                ? "bg-brand text-paper hover:bg-brand-600"
                : "bg-mist text-muted"
            )}
          >
            <ArrowUp size={18} />
          </button>
        </form>
      </Card>
      <p className="text-muted mt-3 text-center text-xs">
        L&apos;assistant IA complet arrive très bientôt.
      </p>
    </div>
  );
}
