import type { Metadata } from "next";
import { LegalPage, LegalSection, Todo } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Shift Office",
  description: "Politique de confidentialité et traitement des données personnelles de Shift Office.",
};

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité" updated="28 juin 2026">
      <LegalSection n={1} title="Responsable du traitement">
        <p>
          Le responsable du traitement des données personnelles collectées sur{" "}
          <strong>shiftoffice.fr</strong> est{" "}
          <strong>Shift Office</strong>, joignable à
          l&apos;adresse <Todo>[À COMPLÉTER — adresse e-mail]</Todo>.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Données collectées">
        <p>Nous traitons les catégories de données suivantes :</p>
        <ul>
          <li>
            <strong>Données saisies dans les formulaires</strong> : informations
            nécessaires à la génération du document (noms, adresses, montants,
            etc.). Ces données sont traitées le temps de générer votre PDF.
          </li>
          <li>
            <strong>Données de paiement</strong> : traitées exclusivement par
            notre prestataire Stripe. Nous ne stockons aucune coordonnée
            bancaire.
          </li>
          <li>
            <strong>Données techniques</strong> : données de connexion strictement
            nécessaires au fonctionnement et à la sécurité du site.
          </li>
        </ul>
      </LegalSection>

      <LegalSection n={3} title="Finalités et base légale">
        <ul>
          <li>
            Génération des documents demandés : exécution du contrat (article 6.1.b
            du RGPD).
          </li>
          <li>
            Traitement des paiements : exécution du contrat et respect
            d&apos;obligations légales.
          </li>
          <li>
            Sécurité et bon fonctionnement du site : intérêt légitime.
          </li>
        </ul>
      </LegalSection>

      <LegalSection n={4} title="Conservation des données">
        <p>
          Les informations saisies pour générer un document ne sont pas
          conservées sur nos serveurs au-delà de la génération du PDF : elles
          sont traitées de manière éphémère, le temps de produire le fichier.
          Les données de facturation nécessaires au respect de nos obligations
          comptables sont conservées par notre prestataire de paiement pendant
          la durée légale applicable.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Destinataires et sous-traitants">
        <p>Les données peuvent être traitées par nos sous-traitants techniques :</p>
        <ul>
          <li>
            <strong>Stripe</strong> — traitement des paiements.
          </li>
          <li>
            <strong>
              <Todo>[À COMPLÉTER — hébergeur]</Todo>
            </strong>{" "}
            — hébergement du site.
          </li>
        </ul>
        <p>
          Aucune donnée n&apos;est vendue ou cédée à des tiers à des fins
          commerciales.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Vos droits">
        <p>
          Conformément au RGPD et à la loi « Informatique et Libertés », vous
          disposez d&apos;un droit d&apos;accès, de rectification,
          d&apos;effacement, de limitation, d&apos;opposition et de portabilité
          de vos données. Vous pouvez exercer ces droits en nous écrivant à{" "}
          <Todo>[À COMPLÉTER — adresse e-mail]</Todo>. Vous avez également le
          droit d&apos;introduire une réclamation auprès de la CNIL
          (www.cnil.fr).
        </p>
      </LegalSection>

      <LegalSection n={7} title="Cookies">
        <p>
          Le site utilise uniquement les cookies strictement nécessaires à son
          fonctionnement et à la sécurité des paiements. Aucun cookie publicitaire
          ou de traçage tiers n&apos;est déposé sans votre consentement.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
