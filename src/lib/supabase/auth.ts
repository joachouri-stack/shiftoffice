"use client";

import { getSupabaseBrowser } from "./client";

/**
 * Helpers d'authentification Supabase, prêts à brancher dans les pages
 * Connexion / Inscription au sprint final. Chaque fonction renvoie une erreur
 * explicite si Supabase n'est pas encore configuré.
 */

const NOT_CONFIGURED = {
  error: "Authentification non configurée (clés Supabase manquantes).",
} as const;

function redirectTo() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/auth/callback`;
}

/** Connexion via Google OAuth. */
export async function signInWithGoogle() {
  const supabase = getSupabaseBrowser();
  if (!supabase) return NOT_CONFIGURED;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectTo() },
  });
  return { error: error?.message ?? null };
}

/** Connexion via lien magique (email sans mot de passe). */
export async function signInWithMagicLink(email: string) {
  const supabase = getSupabaseBrowser();
  if (!supabase) return NOT_CONFIGURED;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo() },
  });
  return { error: error?.message ?? null };
}

/** Connexion email + mot de passe. */
export async function signInWithPassword(email: string, password: string) {
  const supabase = getSupabaseBrowser();
  if (!supabase) return NOT_CONFIGURED;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

/** Création de compte email + mot de passe. */
export async function signUpWithPassword(email: string, password: string) {
  const supabase = getSupabaseBrowser();
  if (!supabase) return NOT_CONFIGURED;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo() },
  });
  return { error: error?.message ?? null };
}

/** Déconnexion. */
export async function signOut() {
  const supabase = getSupabaseBrowser();
  if (!supabase) return NOT_CONFIGURED;
  const { error } = await supabase.auth.signOut();
  return { error: error?.message ?? null };
}

/** Session courante (ou null). */
export async function getCurrentSession() {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}
