import { buildDocument } from "@/lib/pdf/build";
import { priceForSlug } from "@/lib/stripe";
import { paiementAutorise } from "@/lib/payment";
import { enregistrerHistorique } from "@/lib/supabase/historique";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Génération des documents payants (formulaire + PDF).
 *
 * Si Stripe est configuré, un `session_id` de paiement vérifié est exigé :
 * le PDF n'est produit qu'après confirmation, côté serveur, que la session
 * Checkout est payée et correspond bien au type de document demandé.
 * Sans Stripe, la génération reste directe (dev / transition).
 */

export async function POST(req: Request) {
  let body: {
    type_document?: string;
    donnees?: Record<string, unknown>;
    session_id?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const type = body.type_document ?? "";
  const d = body.donnees ?? {};

  // Cette route est réservée aux documents payants.
  if (priceForSlug(type) === null) {
    return Response.json(
      { error: "Type de document non pris en charge." },
      { status: 400 }
    );
  }

  if (!(await paiementAutorise(type, body.session_id))) {
    return Response.json(
      { error: "Paiement requis ou non confirmé." },
      { status: 402 }
    );
  }

  const built = await buildDocument(type, d);
  if (!built) {
    return Response.json(
      { error: "Type de document non pris en charge." },
      { status: 400 }
    );
  }

  await enregistrerHistorique(type);
  return pdfResponse(built.pdf, built.filename);
}

function pdfResponse(pdf: Uint8Array, filename: string): Response {
  return new Response(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
