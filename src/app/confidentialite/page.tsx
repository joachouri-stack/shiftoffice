import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Shift Office",
  description: "Politique de confidentialité et traitement des données personnelles de Shift Office.",
};

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité" updated="9 juillet 2026">
      <LegalSection n={1} title="Responsable du traitement">
        <p>
          Le responsable du traitement des données personnelles collectées sur{" "}
          <strong>shiftoffice.fr</strong> est <strong>Shift Office</strong>,
          joignable à l&apos;adresse <strong>info@shiftoffice.fr</strong>.
        </p>
        <p>
          Cas particulier : lorsque vous saisissez des informations concernant
          vos salariés ou vos locataires (noms, salaires, adresses…), vous
          agissez en qualité d&apos;employeur ou de bailleur et demeurez
          responsable de ces données ; Shift Office intervient alors comme
          outil de traitement et, pour les comptes synchronisés, comme
          sous-traitant hébergeur.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Où sont stockées vos données">
        <ul>
          <li>
            <strong>Sans compte (par défaut)</strong> : les informations que
            vous saisissez (entreprises, salariés, locations) et les PDF
            générés sont enregistrés <strong>uniquement dans votre
            navigateur</strong>, sur votre appareil. Rien n&apos;est conservé
            sur nos serveurs : les données transmises pour produire un PDF
            sont traitées de manière éphémère, le temps de la génération.
          </li>
          <li>
            <strong>Avec un compte (synchronisation)</strong> : si vous créez
            un compte, votre espace (entreprises, salariés, locations,
            historique de documents) est enregistré dans notre base de
            données afin de vous suivre sur tous vos appareils. Les PDF,
            eux, restent stockés localement sur chaque appareil.
          </li>
        </ul>
      </LegalSection>

      <LegalSection n={3} title="Données collectées">
        <ul>
          <li>
            <strong>Données de compte</strong> : adresse email et mot de passe
            (stocké sous forme chiffrée), uniquement si vous créez un compte.
          </li>
          <li>
            <strong>Données saisies dans les formulaires</strong> : informations
            nécessaires à la génération des documents (identités, adresses,
            salaires, numéros de sécurité sociale des salariés concernés,
            montants…).
          </li>
          <li>
            <strong>Données de paiement</strong> : traitées exclusivement par
            notre prestataire Stripe. Nous ne stockons aucune coordonnée
            bancaire.
          </li>
          <li>
            <strong>Données techniques</strong> : données de connexion
            strictement nécessaires au fonctionnement et à la sécurité du site.
          </li>
        </ul>
      </LegalSection>

      <LegalSection n={4} title="Finalités et base légale">
        <ul>
          <li>
            Génération des documents demandés et synchronisation de votre
            espace : exécution du contrat (article 6.1.b du RGPD).
          </li>
          <li>
            Traitement des paiements : exécution du contrat et respect
            d&apos;obligations légales.
          </li>
          <li>
            Assistance de rédaction par intelligence artificielle (facultative,
            déclenchée uniquement par votre clic) : exécution du contrat.
          </li>
          <li>Sécurité et bon fonctionnement du site : intérêt légitime.</li>
        </ul>
      </LegalSection>

      <LegalSection n={5} title="Conservation des données">
        <ul>
          <li>
            <strong>Sans compte</strong> : aucune conservation côté serveur ;
            vous pouvez effacer les données locales à tout moment depuis votre
            navigateur.
          </li>
          <li>
            <strong>Avec un compte</strong> : les données de votre espace sont
            conservées tant que votre compte existe. La suppression du compte
            entraîne l&apos;effacement de l&apos;espace synchronisé.
          </li>
          <li>
            Les données de facturation nécessaires au respect de nos
            obligations comptables sont conservées par notre prestataire de
            paiement pendant la durée légale applicable.
          </li>
        </ul>
      </LegalSection>

      <LegalSection n={6} title="Destinataires et sous-traitants">
        <p>Les données peuvent être traitées par nos sous-traitants techniques :</p>
        <ul>
          <li>
            <strong>Supabase</strong> — hébergement de la base de données des
            comptes et des espaces synchronisés, sur des serveurs situés dans
            l&apos;Union européenne.
          </li>
          <li>
            <strong>Stripe</strong> — traitement des paiements.
          </li>
          <li>
            <strong>Anthropic</strong> — assistance de rédaction par
            intelligence artificielle : lorsque vous cliquez sur «&nbsp;Améliorer
            avec l&apos;IA&nbsp;», le texte concerné est transmis à
            l&apos;API d&apos;Anthropic le temps du traitement. Ces contenus ne
            sont pas utilisés pour entraîner des modèles.
          </li>
          <li>
            <strong>Hostinger International Ltd</strong> — hébergement du site
            (Larnaca, Chypre).
          </li>
        </ul>
        <p>
          Aucune donnée n&apos;est vendue ou cédée à des tiers à des fins
          commerciales.
        </p>
      </LegalSection>

      <LegalSection n={7} title="Vos droits">
        <p>
          Conformément au RGPD et à la loi «&nbsp;Informatique et
          Libertés&nbsp;», vous disposez d&apos;un droit d&apos;accès, de
          rectification, d&apos;effacement, de limitation, d&apos;opposition et
          de portabilité de vos données. Vous pouvez exercer ces droits en nous
          écrivant à <strong>info@shiftoffice.fr</strong>. Vous avez également
          le droit d&apos;introduire une réclamation auprès de la CNIL
          (www.cnil.fr).
        </p>
        <p>
          Si vous saisissez des données concernant vos salariés ou locataires,
          il vous appartient de les en informer et de répondre à leurs demandes
          d&apos;exercice de droits ; nous vous assistons sur simple demande.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Cookies">
        <p>
          Le site utilise uniquement les cookies strictement nécessaires à son
          fonctionnement (dont la session de connexion pour les comptes) et à
          la sécurité des paiements. Aucun cookie publicitaire ou de traçage
          tiers n&apos;est déposé sans votre consentement.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
