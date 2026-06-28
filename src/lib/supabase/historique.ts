import { createClient } from "./server";
import { isSupabaseEnabled } from "./config";
import { DOCUMENTS } from "@/lib/documents";

/**
 * Enregistre (au mieux) une ligne d'historique pour le document généré, si
 * Supabase est configuré ET qu'un utilisateur est connecté. Best-effort :
 * n'interrompt jamais la génération du PDF en cas d'erreur.
 */
export async function enregistrerHistorique(type: string): Promise<void> {
  if (!isSupabaseEnabled()) return;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const doc = DOCUMENTS.find((d) => d.slug === type);
    await supabase.from("documents_historique").insert({
      user_id: user.id,
      type,
      titre: doc?.title ?? type,
      prix: doc?.price ?? 0,
    });
  } catch {
    // silencieux : l'historique ne doit jamais bloquer la génération
  }
}
