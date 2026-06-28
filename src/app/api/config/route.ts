import { isEmailEnabled } from "@/lib/email/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Indique au client quelles fonctionnalités optionnelles sont actives. */
export async function GET() {
  return Response.json({ email: isEmailEnabled() });
}
