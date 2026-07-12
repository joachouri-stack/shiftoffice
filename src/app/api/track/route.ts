import { rateLimitOk, clientIp } from "@/lib/ratelimit";
import { trackServeur } from "@/lib/track";
import { DOCUMENTS } from "@/lib/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Réception des pages vues (statistiques anonymes, sans cookie).
 * Seul l'événement `pageview` est accepté depuis le navigateur — les
 * événements de paiement sont enregistrés côté serveur, jamais déclarés
 * par le client.
 */

const SLUGS = new Set(DOCUMENTS.map((d) => d.slug));

export async function POST(req: Request) {
  if (!rateLimitOk(`track:${clientIp(req)}`, 60, 60_000)) {
    return new Response(null, { status: 429 });
  }

  let body: { sid?: string; path?: string; doc?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const path = typeof body.path === "string" ? body.path : "";
  if (!path.startsWith("/") || path.startsWith("/admin")) {
    return new Response(null, { status: 204 });
  }

  await trackServeur({
    event: "pageview",
    session_id: typeof body.sid === "string" ? body.sid : undefined,
    path,
    doc: typeof body.doc === "string" && SLUGS.has(body.doc) ? body.doc : undefined,
    source: typeof body.source === "string" ? body.source : undefined,
  });

  return new Response(null, { status: 204 });
}
