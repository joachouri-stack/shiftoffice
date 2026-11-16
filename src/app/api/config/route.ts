import { isEmailEnabled } from "@/lib/email/mailer";
import { isAIEnabled } from "@/lib/ia/anthropic";
import { utilisateurAdmin } from "@/lib/admin";
import { utilisateurGratuit } from "@/lib/gratuit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Indique au client quelles fonctionnalités optionnelles sont actives.
 * `admin` et `gratuit` dépendent de la session du visiteur (lien /admin
 * dans l'espace ; accès VIP sans paiement via EMAILS_GRATUITS).
 */
export async function GET() {
  return Response.json({
    email: isEmailEnabled(),
    ia: isAIEnabled(),
    admin: await utilisateurAdmin(),
    gratuit: await utilisateurGratuit(),
  });
}
