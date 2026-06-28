import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy-session";

/**
 * Proxy (ex-middleware, renommé en Next.js 16). Rafraîchit la session
 * Supabase sur chaque requête applicative. No-op si Supabase n'est pas
 * configuré.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Toutes les routes sauf :
     * - les assets statiques (_next/static, _next/image)
     * - les fichiers d'icônes/favicon et images
     * - les routes API (qui gèrent elles-mêmes leur contexte)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
