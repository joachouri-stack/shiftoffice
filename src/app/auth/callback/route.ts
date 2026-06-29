import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseEnabled } from "@/lib/supabase/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Base publique du site. Derrière le proxy de Coolify, `request.url` peut
 * pointer sur localhost ; on privilégie donc l'en-tête X-Forwarded-Host
 * (posé par le proxy) puis NEXT_PUBLIC_SITE_URL, sinon l'origine de la requête.
 */
function getBaseUrl(request: Request): string {
  const fwdHost = request.headers.get("x-forwarded-host");
  const fwdProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (fwdHost) return `${fwdProto}://${fwdHost}`;
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  return new URL(request.url).origin;
}

/** Retour OAuth : échange le code contre une session, puis redirige. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/compte";
  const base = getBaseUrl(request);

  if (code && isSupabaseEnabled()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${base}${next}`);
    }
  }

  return NextResponse.redirect(`${base}/connexion?erreur=auth`);
}
