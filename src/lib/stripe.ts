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
let cachedKey = "";

/**
 * Nettoie la clé collée dans l'environnement : espaces, retours à la ligne,
 * `=` en trop (saisie « KEY==sk_… ») et guillemets d'encadrement sont des
 * erreurs de copier-coller fréquentes qui invalident la clé.
 */
function cleanKey(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/^[='"]+/, "").replace(/['"]+$/, "");
}

export function getStripe(): Stripe | null {
  const key = cleanKey(process.env.STRIPE_SECRET_KEY);
  if (!key) return null;
  if (!cached || cachedKey !== key) {
    cached = new Stripe(key);
    cachedKey = key;
  }
  return cached;
}

export function isStripeEnabled(): boolean {
  return Boolean(cleanKey(process.env.STRIPE_SECRET_KEY));
}

/**
 * Mode « test gratuit » : quand `PAIEMENT_LIBRE` vaut 1/true, le paiement est
 * neutralisé et tous les documents se génèrent directement, même si Stripe est
 * configuré. À activer pour tester, à retirer pour le lancement.
 */
export function isPaiementLibre(): boolean {
  const raw = process.env.PAIEMENT_LIBRE ?? process.env.NEXT_PUBLIC_PAIEMENT_LIBRE ?? "";
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

/** Le paiement est-il réellement exigé (Stripe actif et mode libre désactivé) ? */
export function paiementActif(): boolean {
  return isStripeEnabled() && !isPaiementLibre();
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
