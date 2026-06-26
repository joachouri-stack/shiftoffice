import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <LegalPage
      title="Mentions légales"
      updatedAt="26 juin 2026"
      blocks={[
        {
          heading: "Éditeur du site",
          paragraphs: [
            "Le site et l'application Shift Office sont édités par Shift Office. Les informations légales complètes (raison sociale, forme juridique, capital, RCS, siège social) seront précisées avant la mise en production.",
          ],
        },
        {
          heading: "Directeur de la publication",
          paragraphs: [
            "Le directeur de la publication est le représentant légal de Shift Office.",
          ],
        },
        {
          heading: "Hébergement",
          paragraphs: [
            "Le service est hébergé sur une infrastructure cloud sécurisée. Les coordonnées de l'hébergeur seront communiquées dans cette section.",
          ],
        },
        {
          heading: "Propriété intellectuelle",
          paragraphs: [
            "L'ensemble des éléments du site Shift Office (marque, logo, textes, interface, design) est protégé par le droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.",
          ],
        },
        {
          heading: "Contact",
          paragraphs: [
            "Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter via l'adresse e-mail dédiée du support.",
          ],
        },
      ]}
    />
  );
}
