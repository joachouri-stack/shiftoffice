import { buildDocument } from "@/lib/pdf/build";
import {
  getResend,
  isEmailEnabled,
  isValidEmail,
  EMAIL_FROM,
} from "@/lib/email/resend";
import { priceForSlug, titleForSlug } from "@/lib/stripe";
import { paiementAutorise } from "@/lib/payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Envoie le PDF d'un document par email (Resend). No-op si l'email n'est pas
 * configuré (réponse { emailDisabled: true }). Pour les documents payants, le
 * même contrôle de paiement que la génération est appliqué.
 */
export async function POST(req: Request) {
  if (!isEmailEnabled()) {
    return Response.json({ emailDisabled: true });
  }

  let body: {
    type_document?: string;
    donnees?: Record<string, unknown>;
    email?: string;
    session_id?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const type = body.type_document ?? "";
  const d = body.donnees ?? {};
  const email = (body.email ?? "").trim();

  if (!isValidEmail(email)) {
    return Response.json({ error: "Adresse email invalide." }, { status: 400 });
  }

  // Document payant : exiger un paiement confirmé.
  if (
    priceForSlug(type) !== null &&
    !(await paiementAutorise(type, body.session_id))
  ) {
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

  const resend = getResend();
  if (!resend) return Response.json({ emailDisabled: true });

  const titre = titleForSlug(type);
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `Votre document — ${titre}`,
    text:
      `Bonjour,\n\n` +
      `Vous trouverez ci-joint votre document « ${titre} » généré via Shift Office.\n\n` +
      `Ce document est fourni à titre de modèle ; pensez à le vérifier avant usage officiel.\n\n` +
      `— L'équipe Shift Office\nshiftoffice.fr`,
    attachments: [
      {
        filename: built.filename,
        content: Buffer.from(built.pdf).toString("base64"),
      },
    ],
  });

  if (error) {
    console.error("Resend error", error);
    return Response.json(
      { error: "L'envoi de l'email a échoué." },
      { status: 502 }
    );
  }

  return Response.json({ sent: true });
}
