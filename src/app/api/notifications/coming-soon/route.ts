import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Enregistre une demande « prévenez-moi » pour une fonctionnalité Business.
 * Persiste dans Supabase si configuré ; sinon répond OK (le client garde une
 * copie locale en attendant la base).
 */
export async function POST(req: Request) {
  let body: { email?: string; feature_name?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const feature = (body.feature_name ?? "").trim();
  if (!/\S+@\S+\.\S+/.test(email) || !feature) {
    return Response.json({ error: "Email ou fonctionnalité manquant." }, {
      status: 400,
    });
  }

  try {
    const supabase = await getSupabaseServer();
    if (supabase) {
      await supabase
        .from("notifications_coming_soon")
        .insert({ email, feature_name: feature });
    }
  } catch {
    // Base indisponible : on n'échoue pas, le client a déjà la copie locale.
  }

  return Response.json({ ok: true });
}
