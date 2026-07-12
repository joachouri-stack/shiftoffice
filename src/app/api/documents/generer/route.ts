import { buildDocument } from "@/lib/pdf/build";
import { priceForSlug, paiementActif } from "@/lib/stripe";
import { paiementAutorise } from "@/lib/payment";
import { enregistrerHistorique } from "@/lib/supabase/historique";
import { trackServeur } from "@/lib/track";

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

  // Statistiques : vente confirmée. Uniquement quand un paiement Stripe a
  // réellement été vérifié (pas en mode libre ni pour les comptes VIP, qui
  // génèrent sans session_id). Dédupliqué par `ref` côté lecture : le bouton
  // « Télécharger à nouveau » ne compte pas double.
  if (body.session_id && paiementActif()) {
    await trackServeur({
      event: "paiement",
      doc: type,
      montant: priceForSlug(type) ?? undefined,
      ref: body.session_id,
    });
  }

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
