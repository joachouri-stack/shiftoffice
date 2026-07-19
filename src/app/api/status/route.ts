import { getStripe, isStripeEnabled, isPaiementLibre, paiementActif } from "@/lib/stripe";
import { isEmailEnabled, smtpConfig, getTransport } from "@/lib/email/mailer";

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
 *
 * Avec `?email=1`, teste la connexion/authentification SMTP réelle
 * (`emailOk` + message d'erreur éventuel, jamais le mot de passe).
 */
export async function GET(req: Request) {
  const smtp = smtpConfig();
  const base = {
    ok: true,
    build: "2026-07-status-3",
    stripeConfigure: isStripeEnabled(),
    paiementLibre: isPaiementLibre(),
    paiementActif: paiementActif(),
    generationGratuite: !paiementActif(),
    emailActif: isEmailEnabled(),
    // Diagnostic SMTP sans secret : ce que le serveur voit vraiment.
    smtp: {
      hostVu: smtp?.host ?? Boolean((process.env.SMTP_HOST ?? "").trim()),
      portVu: smtp?.port ?? Boolean((process.env.SMTP_PORT ?? "").trim()),
      userVu: smtp?.user ?? Boolean((process.env.SMTP_USER ?? "").trim()),
      passPresent: Boolean((process.env.SMTP_PASS ?? "").trim()),
      passLongueur: (process.env.SMTP_PASS ?? "").replace(/\s+/g, "").trim().length,
    },
  };

  const url = new URL(req.url);

  if (url.searchParams.get("email") === "1") {
    const transport = getTransport();
    if (!transport) {
      return Response.json({
        ...base,
        emailOk: false,
        emailError: "SMTP incomplet : il manque SMTP_HOST, SMTP_USER ou SMTP_PASS.",
      });
    }
    try {
      await transport.verify();
      return Response.json({ ...base, emailOk: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return Response.json({ ...base, emailOk: false, emailError: msg });
    }
  }

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
