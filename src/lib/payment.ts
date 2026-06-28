import { getStripe, isStripeEnabled } from "@/lib/stripe";

/**
 * Vérifie qu'un paiement valide autorise la production du document `type`.
 * - Stripe désactivé → true (mode direct / transition).
 * - Stripe activé → la session Checkout doit être payée et porter le bon type.
 */
export async function paiementAutorise(
  type: string,
  sessionId: string | undefined
): Promise<boolean> {
  if (!isStripeEnabled()) return true;
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
