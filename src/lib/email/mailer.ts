import nodemailer, { type Transporter } from "nodemailer";
import { getResend } from "./resend";

/**
 * Envoi d'email unifié.
 *
 * Deux transports possibles, dans cet ordre de priorité :
 *  1. SMTP (boîte Hostinger info@shiftoffice.fr) — variables d'environnement :
 *       SMTP_HOST=smtp.hostinger.com
 *       SMTP_PORT=465
 *       SMTP_USER=info@shiftoffice.fr
 *       SMTP_PASS=le mot de passe de la boîte
 *  2. Resend (RESEND_API_KEY) — conservé en secours.
 *
 * Sans configuration, l'email est simplement désactivé (le site fonctionne,
 * les blocs « Recevoir par email » restent masqués).
 */

function smtpConfig() {
  const host = (process.env.SMTP_HOST ?? "").trim();
  const user = (process.env.SMTP_USER ?? "").trim();
  const pass = (process.env.SMTP_PASS ?? "").trim();
  const port = Number(process.env.SMTP_PORT ?? "465") || 465;
  if (!host || !user || !pass) return null;
  return { host, port, user, pass };
}

export function isEmailEnabled(): boolean {
  return Boolean(smtpConfig() || process.env.RESEND_API_KEY);
}

export function emailFrom(): string {
  const env = (process.env.EMAIL_FROM ?? "").trim();
  if (env) return env;
  const smtp = smtpConfig();
  if (smtp) return `Shift Office <${smtp.user}>`;
  return "Shift Office <onboarding@resend.dev>";
}

export function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

let cachedTransport: Transporter | null = null;
let cachedKey = "";

function getTransport(): Transporter | null {
  const smtp = smtpConfig();
  if (!smtp) return null;
  const key = `${smtp.host}:${smtp.port}:${smtp.user}`;
  if (!cachedTransport || cachedKey !== key) {
    cachedTransport = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass },
    });
    cachedKey = key;
  }
  return cachedTransport;
}

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  attachments?: { filename: string; content: Buffer }[];
};

/** Envoie l'email via SMTP, sinon Resend. Lance une erreur en cas d'échec. */
export async function sendEmail(msg: EmailMessage): Promise<void> {
  const transport = getTransport();
  if (transport) {
    await transport.sendMail({
      from: emailFrom(),
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      attachments: msg.attachments,
    });
    return;
  }

  const resend = getResend();
  if (!resend) throw new Error("Aucun transport email configuré");
  const { error } = await resend.emails.send({
    from: emailFrom(),
    to: msg.to,
    subject: msg.subject,
    text: msg.text,
    attachments: msg.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content.toString("base64"),
    })),
  });
  if (error) throw new Error(error.message);
}
