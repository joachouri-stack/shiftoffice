import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Shift Office",
  description: "Conditions générales d'utilisation du site Shift Office.",
};

export default function CguPage() {
  return (
    <LegalPage
      title="Conditions Générales d'Utilisation"
      updated="28 juin 2026"
    >
      <LegalSection n={1} title="Objet">
        <p>
          Les présentes conditions générales d&apos;utilisation (CGU) ont pour
          objet de définir les modalités d&apos;accès et d&apos;utilisation du
          site <strong>shiftoffice.fr</strong>. En accédant au site,
          l&apos;utilisateur accepte les présentes CGU.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Accès au service">
        <p>
          Le site est accessible gratuitement à tout utilisateur disposant
          d&apos;un accès à internet. Certains documents sont gratuits,
          d&apos;autres payants. Les frais d&apos;accès et d&apos;équipement
          (matériel, connexion) restent à la charge de l&apos;utilisateur.
        </p>
        <p>
          Shift Office s&apos;efforce d&apos;assurer la disponibilité du service
          24h/24 mais ne saurait être tenu responsable d&apos;une interruption,
          notamment pour maintenance ou cause de force majeure.
        </p>
      </LegalSection>

      <LegalSection n={3} title="Utilisation conforme">
        <p>L&apos;utilisateur s&apos;engage à :</p>
        <ul>
          <li>
            fournir des informations exactes lors de la génération des documents ;
          </li>
          <li>
            utiliser les documents générés dans un cadre légal et conforme à leur
            destination ;
          </li>
          <li>
            ne pas tenter de porter atteinte au bon fonctionnement, à la
            sécurité ou à l&apos;intégrité du site.
          </li>
        </ul>
      </LegalSection>

      <LegalSection n={4} title="Valeur des documents">
        <p>
          Les documents proposés sont des modèles générés automatiquement à
          partir des informations saisies. Ils sont conçus pour être conformes à
          la réglementation française, mais ne se substituent pas à un conseil
          professionnel personnalisé. L&apos;utilisateur demeure responsable de
          l&apos;usage qu&apos;il fait des documents générés.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Propriété intellectuelle">
        <p>
          Le site, sa charte graphique, ses textes et ses modèles sont protégés
          par le droit de la propriété intellectuelle. Le document généré et
          payé peut être librement utilisé par le client pour ses propres
          besoins, mais le modèle sous-jacent et le site ne peuvent être
          reproduits ou exploités sans autorisation.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Modification des CGU">
        <p>
          Shift Office se réserve le droit de modifier les présentes CGU à tout
          moment. Les CGU applicables sont celles en vigueur à la date
          d&apos;utilisation du site.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
