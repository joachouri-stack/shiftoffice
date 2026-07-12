import { getUser } from "@/lib/supabase/auth";

/**
 * Accès administrateur (tableau de bord /admin) : les comptes dont l'email
 * figure dans EMAILS_ADMIN (virgules, insensible à la casse). Sans variable,
 * l'admin par défaut est le propriétaire du site.
 *
 * Sécurité : l'email provient de la session Supabase vérifiée côté serveur —
 * il faut être CONNECTÉ avec ce compte.
 */
export function emailsAdmin(): string[] {
  const liste = (process.env.EMAILS_ADMIN ?? "")
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"));
  return liste.length > 0 ? liste : ["jo.achouri@gmail.com"];
}

export async function utilisateurAdmin(): Promise<boolean> {
  const user = await getUser();
  const email = user?.email?.toLowerCase();
  return Boolean(email && emailsAdmin().includes(email));
}
