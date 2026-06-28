import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseEnabled, SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

/**
 * Rafraîchit la session Supabase à chaque requête (appelé depuis proxy.ts,
 * l'ex-middleware renommé « proxy » en Next.js 16). Sans Supabase configuré,
 * laisse passer la requête sans rien faire.
 */
export async function updateSession(
  request: NextRequest
): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  if (!isSupabaseEnabled()) return response;

  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    // IMPORTANT : ne pas exécuter de logique entre createServerClient et getUser.
    await supabase.auth.getUser();
  } catch {
    // Supabase injoignable/mal configuré : on ne bloque jamais la requête.
  }

  return response;
}
