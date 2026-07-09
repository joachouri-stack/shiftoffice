import { redirect } from "next/navigation";
import { DOCUMENTS, flowHref } from "@/lib/documents";

/**
 * Ancienne page de génération mono-formulaire, remplacée par les parcours
 * autonomes (/fiche-de-paie, /contrat-travail, …). On redirige pour ne pas
 * casser les anciens liens (retour Stripe annulé, favoris, historique).
 */
export default async function GenererRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = DOCUMENTS.find((d) => d.slug === slug);
  redirect(doc ? flowHref(doc.slug) : "/#produits");
}
