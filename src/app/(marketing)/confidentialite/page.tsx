import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function ConfidentialitePage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      updatedAt="26 juin 2026"
      blocks={[
        {
          heading: "Notre engagement",
          paragraphs: [
            "Chez Shift Office, la protection de vos données est une priorité. Nous collectons uniquement les informations nécessaires au bon fonctionnement du service et à l'amélioration de votre expérience.",
          ],
        },
        {
          heading: "Données collectées",
          paragraphs: [
            "Nous collectons les données que vous nous fournissez (informations de compte, profil entreprise, documents) ainsi que des données d'usage techniques permettant d'assurer la sécurité et la performance du service.",
          ],
        },
        {
          heading: "Utilisation des données",
          paragraphs: [
            "Vos données servent exclusivement à fournir le service Shift Office : gestion de vos documents, assistance par intelligence artificielle, et amélioration continue du produit. Elles ne sont jamais vendues à des tiers.",
          ],
        },
        {
          heading: "Sécurité",
          paragraphs: [
            "Vos documents sensibles sont chiffrés et stockés dans un coffre-fort sécurisé. Nous appliquons les meilleures pratiques de l'industrie pour protéger l'intégrité et la confidentialité de vos informations.",
          ],
        },
        {
          heading: "Vos droits (RGPD)",
          paragraphs: [
            "Conformément au Règlement Général sur la Protection des Données, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Vous pouvez exercer ces droits à tout moment en nous contactant.",
          ],
        },
      ]}
    />
  );
}
