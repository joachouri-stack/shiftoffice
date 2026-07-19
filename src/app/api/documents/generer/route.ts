import { buildDocument } from "@/lib/pdf/build";
import { getStripe, priceForSlug, titleForSlug, paiementActif } from "@/lib/stripe";
import { paiementAutorise } from "@/lib/payment";
import { enregistrerHistorique } from "@/lib/supabase/historique";
import { trackServeur } from "@/lib/track";
import { isEmailEnabled, isValidEmail, sendEmail } from "@/lib/email/mailer";

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
    // Filet de sécurité : le PDF part aussi par email à l'adresse saisie lors
    // du paiement Stripe. En arrière-plan, sans retarder le téléchargement.
    void envoyerCopieAcheteur(body.session_id, type, built.pdf, built.filename);
  }

  return pdfResponse(built.pdf, built.filename);
}

// Sessions Stripe déjà servies par email — évite le doublon quand le client
// clique « Télécharger à nouveau » (mémoire du processus : suffisant, un
// éventuel double envoi après redémarrage est sans gravité).
const emailsEnvoyes = new Set<string>();

async function envoyerCopieAcheteur(
  sessionId: string,
  type: string,
  pdf: Uint8Array,
  filename: string
): Promise<void> {
  if (!isEmailEnabled() || emailsEnvoyes.has(sessionId)) return;
  emailsEnvoyes.add(sessionId);
  try {
    const stripe = getStripe();
    if (!stripe) return;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const email = session.customer_details?.email ?? "";
    if (!isValidEmail(email)) return;
    const titre = titleForSlug(type);
    await sendEmail({
      to: email,
      subject: `Votre achat Shift Office — ${titre}`,
      text:
        `Bonjour,\n\n` +
        `Merci pour votre achat ! Vous trouverez ci-joint votre document ` +
        `« ${titre} » au format PDF.\n\n` +
        `Il reste aussi disponible dans « Mon espace » sur shiftoffice.fr ` +
        `depuis l'appareil utilisé pour le générer.\n\n` +
        `Un souci, une question ? Répondez simplement à cet email.\n\n` +
        `— L'équipe Shift Office\nshiftoffice.fr`,
      attachments: [{ filename, content: Buffer.from(pdf) }],
    });
  } catch (err) {
    // Best-effort : l'échec de l'email ne doit pas gêner le téléchargement.
    emailsEnvoyes.delete(sessionId);
    console.error("email acheteur:", err);
  }
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
