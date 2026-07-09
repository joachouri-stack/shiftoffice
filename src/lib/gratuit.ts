import { getUser } from "@/lib/supabase/auth";

/**
 * Accès gratuit par email (liste VIP) : les comptes dont l'email figure dans
 * la variable d'environnement EMAILS_GRATUITS génèrent tous les documents
 * sans payer, même quand Stripe est actif.
 *
 * Format : emails séparés par des virgules, insensible à la casse.
 *   EMAILS_GRATUITS=jo@exemple.fr, ami@exemple.fr
 *
 * Sécurité : l'email est celui de la session Supabase vérifiée côté
 * serveur — il faut être CONNECTÉ avec ce compte, pas juste taper l'email.
 */
function listeEmailsGratuits(): string[] {
  return (process.env.EMAILS_GRATUITS ?? "")
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"));
}

export async function utilisateurGratuit(): Promise<boolean> {
  const liste = listeEmailsGratuits();
  if (liste.length === 0) return false;
  const user = await getUser();
  const email = user?.email?.toLowerCase();
  return Boolean(email && liste.includes(email));
}
