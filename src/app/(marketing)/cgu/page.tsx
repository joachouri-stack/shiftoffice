import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = { title: "Conditions générales d'utilisation" };

export default function CguPage() {
  return (
    <LegalPage
      title="Conditions générales d'utilisation"
      updatedAt="26 juin 2026"
      blocks={[
        {
          heading: "Objet",
          paragraphs: [
            "Les présentes conditions générales d'utilisation (CGU) encadrent l'accès et l'utilisation de Shift Office, l'assistant intelligent dédié aux artisans du bâtiment.",
          ],
        },
        {
          heading: "Accès au service",
          paragraphs: [
            "L'accès à Shift Office nécessite la création d'un compte. Vous vous engagez à fournir des informations exactes et à préserver la confidentialité de vos identifiants.",
          ],
        },
        {
          heading: "Utilisation",
          paragraphs: [
            "Vous vous engagez à utiliser Shift Office conformément à sa destination et à la réglementation en vigueur. Tout usage frauduleux ou contraire à l'ordre public est interdit.",
          ],
        },
        {
          heading: "Abonnement et résiliation",
          paragraphs: [
            "Shift Office propose une formule gratuite et une formule payante sans engagement. Vous pouvez résilier votre abonnement à tout moment, depuis votre espace, sans frais.",
          ],
        },
        {
          heading: "Responsabilité",
          paragraphs: [
            "Shift Office met tout en œuvre pour assurer la disponibilité et la fiabilité du service. L'assistant IA fournit une aide à la décision ; l'utilisateur reste responsable de la vérification des documents générés.",
          ],
        },
        {
          heading: "Évolution des CGU",
          paragraphs: [
            "Les présentes CGU peuvent être mises à jour. Les utilisateurs seront informés de toute modification substantielle.",
          ],
        },
      ]}
    />
  );
}
