import { isStripeEnabled, isPaiementLibre, paiementActif } from "@/lib/stripe";

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
 */
export async function GET() {
  return Response.json({
    ok: true,
    build: "2026-07-status-1",
    stripeConfigure: isStripeEnabled(),
    paiementLibre: isPaiementLibre(),
    paiementActif: paiementActif(),
    generationGratuite: !paiementActif(),
  });
}
