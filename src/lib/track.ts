import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  isSupabaseEnabled,
} from "@/lib/supabase/config";

/**
 * Statistiques anonymes — insertion d'un événement dans la table `events`.
 *
 * Aucune donnée personnelle : pas d'email, pas d'IP, pas de cookie. Seuls
 * un identifiant de session aléatoire, la page, le document et la source
 * sont enregistrés (voir supabase/analytics.sql).
 *
 * Best-effort : une panne de tracking ne doit JAMAIS faire échouer la
 * requête métier (paiement, génération) — toute erreur est avalée.
 */

export type Evenement = {
  event: "pageview" | "checkout" | "paiement" | "gratuit";
  session_id?: string;
  path?: string;
  doc?: string;
  source?: string;
  montant?: number;
  ref?: string;
};

function tronque(v: string | undefined, max: number): string | null {
  const s = (v ?? "").trim();
  return s ? s.slice(0, max) : null;
}

export async function trackServeur(e: Evenement): Promise<void> {
  if (!isSupabaseEnabled()) return;
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase.from("events").insert({
      event: e.event,
      session_id: tronque(e.session_id, 64),
      path: tronque(e.path, 200),
      doc: tronque(e.doc, 40),
      source: tronque(e.source, 120),
      montant: typeof e.montant === "number" && isFinite(e.montant) ? e.montant : null,
      ref: tronque(e.ref, 120),
    });
    if (error) console.error("track:", error.message);
  } catch (err) {
    console.error("track:", err);
  }
}
