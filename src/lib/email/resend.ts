import { Resend } from "resend";

/**
 * Envoi d'email via Resend. Activé seulement si RESEND_API_KEY est défini.
 * EMAIL_FROM doit utiliser un domaine vérifié dans Resend ; par défaut on
 * utilise l'expéditeur de test « onboarding@resend.dev » (utile avant la
 * vérification du domaine shiftoffice.fr).
 */
let cached: Resend | null = null;

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!cached) cached = new Resend(key);
  return cached;
}

export function isEmailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export const EMAIL_FROM =
  process.env.EMAIL_FROM || "Shift Office <onboarding@resend.dev>";

export function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}
