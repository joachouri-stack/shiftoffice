import { redirect } from "next/navigation";

/**
 * L'espace unique du site est /espace : il fonctionne sans compte (données
 * locales) et se synchronise automatiquement quand l'utilisateur est
 * connecté. /compte est conservé pour les anciens liens mais redirige
 * toujours — évite deux espaces concurrents.
 */
export default function CompteLayout() {
  redirect("/espace");
}
