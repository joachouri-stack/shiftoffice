"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";
import type { Database } from "./database.types";

/**
 * Client Supabase côté navigateur (singleton).
 * Renvoie `null` tant que les variables d'environnement ne sont pas
 * configurées — les appelants doivent gérer ce cas et basculer sur le
 * stockage local-first.
 */
let browserClient: ReturnType<
  typeof createBrowserClient<Database>
> | null = null;

export function getSupabaseBrowser() {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
  }
  return browserClient;
}
