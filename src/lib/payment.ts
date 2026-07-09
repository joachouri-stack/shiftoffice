import { getStripe, paiementActif } from "@/lib/stripe";
import { utilisateurGratuit } from "@/lib/gratuit";

/**
 * Vérifie qu'un paiement valide autorise la production du document `type`.
 * - Paiement inactif (Stripe absent ou mode libre) → true (génération directe).
 * - Compte VIP connecté (EMAILS_GRATUITS) → true, sans paiement.
 * - Paiement actif → la session Checkout doit être payée et porter le bon type.
 */
export async function paiementAutorise(
  type: string,
  sessionId: string | undefined
): Promise<boolean> {
  if (!paiementActif()) return true;
  if (await utilisateurGratuit()) return true;
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
