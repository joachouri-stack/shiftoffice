import { getStripe, isStripeEnabled, isPaiementLibre, paiementActif } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Point de diagnostic public (aucun secret exposé).
 * Permet de vérifier, depuis le site en ligne, quel build et quelle
 * configuration de paiement sont réellement actifs.
 *
 * - `build` : marqueur de version, change à chaque déploiement de ce fichier.
 * - `stripeConfigure` : une clé STRIPE_SECRET_KEY est présente.
 * - `paiementLibre` : la variable PAIEMENT_LIBRE est active.
 * - `paiementActif` : le paiement est réellement exigé (Stripe et pas de mode libre).
 *
 * Avec `?stripe=1`, tente un appel réel à l'API Stripe et rapporte le
 * résultat (`stripeOk` + message d'erreur éventuel, jamais de secret).
 */
export async function GET(req: Request) {
  const base = {
    ok: true,
    build: "2026-07-status-2",
    stripeConfigure: isStripeEnabled(),
    paiementLibre: isPaiementLibre(),
    paiementActif: paiementActif(),
    generationGratuite: !paiementActif(),
  };

  const url = new URL(req.url);
  if (url.searchParams.get("stripe") !== "1") return Response.json(base);

  const stripe = getStripe();
  if (!stripe) return Response.json({ ...base, stripeOk: false, stripeError: "Clé absente." });
  try {
    await stripe.balance.retrieve();
    return Response.json({ ...base, stripeOk: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ ...base, stripeOk: false, stripeError: msg });
  }
}
