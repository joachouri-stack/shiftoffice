import {
  getStripe,
  paiementActif,
  priceForSlug,
  titleForSlug,
} from "@/lib/stripe";
import { utilisateurGratuit } from "@/lib/gratuit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Démarre une session de paiement Stripe Checkout pour un document payant.
 *
 * Réponse :
 *  - { url }            → rediriger le navigateur vers Stripe.
 *  - { paymentDisabled }→ Stripe n'est pas configuré : le client génère
 *                         directement le PDF (comportement de dev/transition).
 */

function originOf(req: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const origin = req.headers.get("origin");
  if (origin) return origin;
  const host = req.headers.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

export async function POST(req: Request) {
  let body: { type?: string; slug?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const slug = body.slug ?? body.type ?? "";
  const type = body.type ?? slug;

  // Paiement inactif (Stripe absent ou mode « test gratuit » PAIEMENT_LIBRE) →
  // le client générera directement le document, sans passer par Stripe.
  if (!paiementActif()) {
    return Response.json({ paymentDisabled: true });
  }

  // Compte VIP (EMAILS_GRATUITS) connecté → génération directe sans paiement.
  if (await utilisateurGratuit()) {
    return Response.json({ paymentDisabled: true });
  }

  const price = priceForSlug(slug);
  if (price === null) {
    return Response.json(
      { error: "Document inconnu ou gratuit." },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return Response.json({ paymentDisabled: true });
  }

  const origin = originOf(req);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(price * 100),
            product_data: {
              name: `Shift Office — ${titleForSlug(slug)}`,
              description: "Document généré au format PDF, conforme 2026.",
            },
          },
        },
      ],
      metadata: { type, slug },
      success_url: `${origin}/generer/${slug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/generer/${slug}?paiement=annule`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    // Détail complet dans les logs serveur ; message générique côté client
    // (le diagnostic fin passe par /api/status?stripe=1).
    console.error("Stripe checkout error", err);
    return Response.json(
      { error: "La création du paiement a échoué. Réessayez dans un instant." },
      { status: 502 }
    );
  }
}
