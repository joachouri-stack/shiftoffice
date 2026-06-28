import Stripe from "stripe";
import { DOCUMENTS } from "@/lib/documents";

/**
 * Client Stripe côté serveur.
 *
 * Le paiement n'est exigé que si `STRIPE_SECRET_KEY` est défini dans
 * l'environnement. Tant que la clé est absente, le site fonctionne en mode
 * « génération directe » (utile en dev et avant l'activation du paiement).
 */

let cached: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) {
    cached = new Stripe(key);
  }
  return cached;
}

export function isStripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Prix (en euros) d'un document payant, d'après le catalogue. */
export function priceForSlug(slug: string): number | null {
  const doc = DOCUMENTS.find((d) => d.slug === slug);
  if (!doc || doc.price <= 0) return null;
  return doc.price;
}

export function titleForSlug(slug: string): string {
  return DOCUMENTS.find((d) => d.slug === slug)?.title ?? slug;
}
