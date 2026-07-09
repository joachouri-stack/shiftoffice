import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { DOCUMENTS, formatPrice } from "@/lib/documents";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente",
  description: "Conditions générales de vente des documents Shift Office.",
};

export default function CgvPage() {
  const payants = DOCUMENTS.filter((d) => d.price > 0);
  const gratuits = DOCUMENTS.filter((d) => d.price === 0);

  return (
    <LegalPage title="Conditions Générales de Vente" updated="28 juin 2026">
      <LegalSection n={1} title="Objet">
        <p>
          Les présentes conditions générales de vente (CGV) régissent les ventes
          de documents au format PDF proposés sur le site{" "}
          <strong>shiftoffice.fr</strong> par{" "}
          <strong>Shift Office</strong> (ci-après « Shift
          Office »). Toute commande implique l&apos;acceptation sans réserve des
          présentes CGV.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Services proposés">
        <p>
          Shift Office permet de générer des documents administratifs et RH à
          l&apos;unité, à partir des informations saisies par le client. Le
          document est produit au format PDF, conforme à la réglementation
          française en vigueur, et téléchargeable immédiatement après paiement.
        </p>
        <p>
          Certains documents sont proposés gratuitement
          {gratuits.length > 0 && (
            <> ({gratuits.map((d) => d.title.toLowerCase()).join(", ")})</>
          )}
          .
        </p>
      </LegalSection>

      <LegalSection n={3} title="Prix">
        <p>
          Les prix sont indiqués en euros, toutes taxes comprises. Le tarif de
          chaque document est le suivant :
        </p>
        <ul>
          {payants.map((d) => (
            <li key={d.slug}>
              {d.title} : <strong>{formatPrice(d.price)}</strong>
            </li>
          ))}
        </ul>
        <p>
          Shift Office se réserve le droit de modifier ses prix à tout moment, le
          tarif applicable étant celui affiché au moment de la commande.
        </p>
      </LegalSection>

      <LegalSection n={4} title="Commande et paiement">
        <p>
          Le client sélectionne un document, renseigne les informations
          nécessaires, puis procède au paiement. Le paiement s&apos;effectue en
          ligne par carte bancaire via notre prestataire de paiement sécurisé{" "}
          <strong>Stripe</strong>. Shift Office n&apos;a accès à aucune donnée
          bancaire, celles-ci étant traitées directement par Stripe.
        </p>
        <p>
          La commande est considérée comme ferme et définitive après
          confirmation du paiement.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Livraison">
        <p>
          Le document est généré et mis à disposition au téléchargement
          immédiatement après la confirmation du paiement. Aucun envoi postal
          n&apos;est effectué. En cas de difficulté de téléchargement, le client
          peut nous contacter à{" "}
          <strong>info@shiftoffice.fr</strong>.
        </p>
      </LegalSection>

      <LegalSection
        n={6}
        title="Droit de rétractation — renonciation"
      >
        <p>
          Conformément à l&apos;article L. 221-28 13° du Code de la
          consommation, le droit de rétractation ne peut être exercé pour la
          fourniture d&apos;un contenu numérique non fourni sur un support
          matériel dont l&apos;exécution a commencé après accord préalable
          exprès du consommateur et renoncement exprès à son droit de
          rétractation.
        </p>
        <p>
          <strong>
            En validant sa commande, le client demande expressément la
            génération immédiate de son document et reconnaît renoncer à son
            droit de rétractation dès le téléchargement du fichier PDF.
          </strong>{" "}
          Aucun remboursement ne pourra donc être réclamé pour un document déjà
          généré et téléchargé.
        </p>
      </LegalSection>

      <LegalSection n={7} title="Remboursement">
        <p>
          Hors le cas de renonciation visé ci-dessus, un remboursement pourra
          être accordé en cas de problème technique ayant empêché la génération
          ou le téléchargement du document commandé et payé, après prise de
          contact avec notre support. La demande doit être adressée à{" "}
          <strong>info@shiftoffice.fr</strong> dans un délai de 14 jours.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Nature des documents et responsabilité">
        <p>
          Les documents fournis sont des modèles personnalisés à partir des
          informations saisies par le client. Ils ne constituent pas un conseil
          juridique, comptable ou fiscal personnalisé. Le client est seul
          responsable de l&apos;exactitude des informations qu&apos;il saisit et
          de l&apos;usage qu&apos;il fait des documents. Les calculs (notamment
          de cotisations sur les bulletins de paie) sont fournis à titre
          indicatif et doivent être vérifiés pour les usages officiels.
        </p>
      </LegalSection>

      <LegalSection n={9} title="Données personnelles">
        <p>
          Le traitement des données personnelles est décrit dans notre{" "}
          <a href="/confidentialite">politique de confidentialité</a>.
        </p>
      </LegalSection>

      <LegalSection n={10} title="Droit applicable et litiges">
        <p>
          Les présentes CGV sont soumises au droit français. En cas de litige,
          une solution amiable sera recherchée avant toute action judiciaire.
          Conformément à la réglementation, le client peut recourir à un
          médiateur de la consommation. À défaut d&apos;accord, les tribunaux
          français seront compétents.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
