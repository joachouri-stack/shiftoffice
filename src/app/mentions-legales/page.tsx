import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Mentions légales — Shift Office",
  description: "Mentions légales du site Shift Office.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" updated="28 juin 2026">
      <LegalSection n={1} title="Éditeur du site">
        <p>
          Le site <strong>shiftoffice.fr</strong> est édité par :
        </p>
        <ul>
          <li>
            Éditeur : <strong>Johane Achouri</strong>, entrepreneur individuel
          </li>
          <li>
            Nom commercial : <strong>Shift Office</strong>
          </li>
          <li>
            Forme juridique : <strong>Entreprise individuelle — régime
            micro-entrepreneur (auto-entrepreneur)</strong>
          </li>
          <li>
            Adresse : <strong>151 rue Albert Camus, 84100 Orange</strong>
          </li>
          <li>
            SIRET : <strong>490 415 031 00122</strong>
          </li>
          <li>
            RCS : <strong>Avignon 490 415 031</strong>
          </li>
          <li>
            Code APE / NAF : <strong>8559A</strong>
          </li>
          <li>
            TVA : <strong>TVA non applicable, art. 293 B du CGI</strong>{" "}
            (franchise en base de TVA)
          </li>
          <li>
            E-mail : <strong>info@shiftoffice.fr</strong>
          </li>
          <li>
            Téléphone : <strong>07 69 01 02 02</strong>
          </li>
        </ul>
      </LegalSection>

      <LegalSection n={2} title="Directeur de la publication">
        <p>
          Le directeur de la publication est{" "}
          <strong>Johane Achouri</strong>, en qualité d&apos;entrepreneur
          individuel.
        </p>
      </LegalSection>

      <LegalSection n={3} title="Hébergement">
        <p>Le site est hébergé par :</p>
        <ul>
          <li>
            Hébergeur : <strong>Hostinger International Ltd</strong>
          </li>
          <li>
            Adresse : 61 Lordou Vironos Street, 6023 Larnaca, Chypre
          </li>
          <li>
            Site : <a href="https://www.hostinger.fr">www.hostinger.fr</a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection n={4} title="Propriété intellectuelle">
        <p>
          L&apos;ensemble des éléments du site (textes, logos, charte
          graphique, modèles de documents, code source) est protégé par le droit
          de la propriété intellectuelle et demeure la propriété exclusive de
          l&apos;éditeur, sauf mention contraire. Toute reproduction ou
          réutilisation sans autorisation est interdite.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Responsabilité">
        <p>
          Les documents générés par Shift Office sont des modèles établis à
          partir des informations fournies par l&apos;utilisateur. Ils sont
          conçus pour être conformes à la réglementation en vigueur, mais ne
          constituent pas un conseil juridique personnalisé. L&apos;utilisateur
          reste responsable de la vérification et de l&apos;adaptation des
          documents à sa situation. Pour les situations complexes, une relecture
          par un professionnel (expert-comptable, avocat) est recommandée.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Contact">
        <p>
          Pour toute question, vous pouvez nous écrire à{" "}
          <strong>info@shiftoffice.fr</strong>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
