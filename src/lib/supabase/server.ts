import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

/**
 * Client Supabase côté serveur (Server Components, Route Handlers, Server
 * Actions). Lit/écrit la session via les cookies (API `cookies()` async).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
          // Appel depuis un Server Component : l'écriture de cookies y est
          // interdite. Le proxy de session se charge du rafraîchissement.
        }
      },
    },
  });
}
