/**
 * Configuration Supabase — lecture des variables d'environnement.
 * Tant que les clés ne sont pas renseignées, `isSupabaseConfigured()` renvoie
 * false et l'app continue de fonctionner en mode local-first.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True uniquement si l'URL et la clé publique sont toutes deux présentes. */
export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";
}
