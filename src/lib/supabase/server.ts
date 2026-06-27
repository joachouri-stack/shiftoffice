import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";
import type { Database } from "./database.types";

/**
 * Client Supabase côté serveur (route handlers, server components).
 * Gère les cookies de session via next/headers. Renvoie `null` tant que les
 * variables d'environnement ne sont pas configurées.
 *
 * Next 16 : cookies() est asynchrone — d'où le `await` côté appelant.
 */
export async function getSupabaseServer() {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Appelé depuis un Server Component : l'écriture de cookies y est
          // interdite. Le refresh de session est alors géré par le middleware.
        }
      },
    },
  });
}
