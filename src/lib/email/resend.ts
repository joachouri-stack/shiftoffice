import { Resend } from "resend";

/**
 * Client Resend — transport de secours du mailer (voir mailer.ts, qui
 * privilégie le SMTP). Activé seulement si RESEND_API_KEY est défini.
 */
let cached: Resend | null = null;

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!cached) cached = new Resend(key);
  return cached;
}
