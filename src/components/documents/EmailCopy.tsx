"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Mail } from "lucide-react";

type State = "idle" | "sending" | "sent" | "error";

/**
 * Bloc « Recevoir par email ». Ne s'affiche que si Resend est configuré
 * (vérifié via /api/config). Reconstruit le PDF côté serveur et l'envoie en
 * pièce jointe à l'adresse saisie.
 */
export function EmailCopy({
  type,
  donnees,
  sessionId,
  defaultEmail = "",
}: {
  type: string;
  donnees: Record<string, unknown>;
  sessionId?: string;
  defaultEmail?: string;
}) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [email, setEmail] = useState(defaultEmail);
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    let active = true;
    fetch("/api/config")
      .then((r) => r.json())
      .then((c) => active && setEnabled(Boolean(c.email)))
      .catch(() => active && setEnabled(false));
    return () => {
      active = false;
    };
  }, []);

  if (!enabled) return null;

  async function send() {
    if (state === "sending" || !email.trim()) return;
    setState("sending");
    try {
      const res = await fetch("/api/documents/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type_document: type,
          donnees,
          email: email.trim(),
          session_id: sessionId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setState(res.ok && data.sent ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="bg-vert-l text-vert mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3.5 py-2.5 text-sm font-semibold">
        <Check size={16} />
        Document envoyé à {email}.
      </div>
    );
  }

  return (
    <div className="border-or/20 bg-creme/50 mt-4 rounded-xl border p-4">
      <p className="text-noir flex items-center gap-2 text-sm font-semibold">
        <Mail size={15} className="text-or-d" />
        Recevoir une copie par email
      </p>
      <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
          placeholder="votre@email.fr"
          className="border-or/30 bg-white text-noir placeholder:text-gris/50 focus:border-or focus:ring-or/15 h-11 flex-1 rounded-lg border px-3.5 text-sm outline-none transition-all focus:ring-4"
        />
        <button
          type="button"
          onClick={send}
          disabled={state === "sending" || !email.trim()}
          className="bg-noir inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {state === "sending" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Mail size={16} />
          )}
          Envoyer
        </button>
      </div>
      {state === "error" && (
        <p className="mt-2 text-xs font-medium text-red-600">
          L&apos;envoi a échoué. Vérifiez l&apos;adresse et réessayez.
        </p>
      )}
    </div>
  );
}
