"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

function messageFr(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("invalid login")) return "Email ou mot de passe incorrect.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Un compte existe déjà avec cet email. Connectez-vous.";
  if (m.includes("password") && m.includes("6"))
    return "Le mot de passe doit faire au moins 6 caractères.";
  if (m.includes("email")) return "Adresse email invalide.";
  return "Une erreur est survenue. Réessayez.";
}

export function EmailPasswordForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setInfo("");
    const supabase = createClient();
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setError(messageFr(error.message));
        } else if (data.session) {
          window.location.assign("/compte");
          return;
        } else {
          setInfo(
            "Compte créé ! Vérifiez votre email pour confirmer, puis connectez-vous."
          );
          setMode("login");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setError(messageFr(error.message));
        } else {
          window.location.assign("/compte");
          return;
        }
      }
    } catch {
      setError("Une erreur réseau est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const FIELD =
    "border-or/30 bg-white text-noir placeholder:text-gris/50 focus:border-or focus:ring-or/15 h-11 w-full rounded-lg border px-3.5 text-sm outline-none transition-all focus:ring-4";

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="text-noir mb-1.5 block text-sm font-medium">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@email.fr"
          className={FIELD}
          autoComplete="email"
        />
      </label>
      <label className="block">
        <span className="text-noir mb-1.5 block text-sm font-medium">
          Mot de passe
        </span>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className={FIELD}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
      </label>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {info && (
        <p className="bg-vert-l text-vert rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium">
          {info}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-orange hover:bg-orange-d inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-bold text-white transition-colors disabled:opacity-60"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        {mode === "login" ? "Se connecter" : "Créer mon compte"}
      </button>

      <p className="text-gris pt-1 text-center text-sm">
        {mode === "login" ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
            setInfo("");
          }}
          className="text-orange font-semibold hover:underline"
        >
          {mode === "login" ? "Créer un compte" : "Se connecter"}
        </button>
      </p>
    </form>
  );
}
