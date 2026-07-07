import { getStripe, paiementActif } from "@/lib/stripe";

/**
 * Vérifie qu'un paiement valide autorise la production du document `type`.
 * - Paiement inactif (Stripe absent ou mode libre) → true (génération directe).
 * - Paiement actif → la session Checkout doit être payée et porter le bon type.
 */
export async function paiementAutorise(
  type: string,
  sessionId: string | undefined
): Promise<boolean> {
  if (!paiementActif()) return true;
  const stripe = getStripe();
  if (!stripe) return true;
  if (!sessionId) return false;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session.payment_status === "paid" && session.metadata?.type === type;
  } catch {
    return false;
  }
}
