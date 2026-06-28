import { isEmailEnabled } from "@/lib/email/resend";
import { isAIEnabled } from "@/lib/ia/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Indique au client quelles fonctionnalités optionnelles sont actives. */
export async function GET() {
  return Response.json({ email: isEmailEnabled(), ia: isAIEnabled() });
}
