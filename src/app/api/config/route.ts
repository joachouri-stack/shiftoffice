import { isEmailEnabled } from "@/lib/email/mailer";
import { isAIEnabled } from "@/lib/ia/anthropic";
import { utilisateurAdmin } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Indique au client quelles fonctionnalités optionnelles sont actives.
 * `admin` dépend de la session du visiteur (lien /admin dans l'espace).
 */
export async function GET() {
  return Response.json({
    email: isEmailEnabled(),
    ia: isAIEnabled(),
    admin: await utilisateurAdmin(),
  });
}
