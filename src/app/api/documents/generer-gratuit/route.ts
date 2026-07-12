import { buildDocument } from "@/lib/pdf/build";
import { enregistrerHistorique } from "@/lib/supabase/historique";
import { DOCUMENTS } from "@/lib/documents";
import { trackServeur } from "@/lib/track";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dérivé du catalogue : un document marqué « free » y est toujours accepté.
const FREE_TYPES = DOCUMENTS.filter((d) => d.free).map((d) => d.slug);

export async function POST(req: Request) {
  let body: { type_document?: string; donnees?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const type = body.type_document ?? "";
  const d = body.donnees ?? {};

  if (!FREE_TYPES.includes(type)) {
    return Response.json(
      { error: "Ce document n'est pas disponible gratuitement." },
      { status: 400 }
    );
  }

  const built = await buildDocument(type, d);
  if (!built) {
    return Response.json(
      { error: "Document bientôt disponible." },
      { status: 400 }
    );
  }

  await enregistrerHistorique(type);
  await trackServeur({ event: "gratuit", doc: type });

  return new Response(Buffer.from(built.pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${built.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
