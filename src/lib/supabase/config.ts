/**
 * Configuration Supabase — l'authentification et l'historique ne s'activent
 * que si les variables d'environnement sont présentes. Sans elles, le site
 * fonctionne normalement (les pages /connexion et /compte affichent un avis
 * « bientôt disponible »).
 *
 * ⚠️ Les variables NEXT_PUBLIC_* doivent être disponibles AU MOMENT DU BUILD
 * (Coolify : les définir avant le build) pour être injectées côté client.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseEnabled(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
