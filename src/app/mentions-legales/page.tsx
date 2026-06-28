import type { Metadata } from "next";
import { LegalPage, LegalSection, Todo } from "@/components/legal/LegalPage";

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
            Dénomination sociale : <strong>Shift Office</strong>
          </li>
          <li>
            Forme juridique : <Todo>[À COMPLÉTER — SAS, SASU, EURL…]</Todo>
          </li>
          <li>
            Capital social : <Todo>[À COMPLÉTER]</Todo>
          </li>
          <li>
            Siège social : <Todo>[À COMPLÉTER — adresse]</Todo>
          </li>
          <li>
            SIRET : <strong>490 415 031 00122</strong>
          </li>
          <li>
            RCS : <Todo>[À COMPLÉTER — ville d&apos;immatriculation]</Todo> 490 415
            031
          </li>
          <li>
            Code APE / NAF : <strong>8559A</strong>
          </li>
          <li>
            Numéro de TVA intracommunautaire :{" "}
            <strong>FR 30 490 415 031</strong>
          </li>
          <li>
            Adresse e-mail : <Todo>[À COMPLÉTER — ex. contact@shiftoffice.fr]</Todo>
          </li>
        </ul>
      </LegalSection>

      <LegalSection n={2} title="Directeur de la publication">
        <p>
          Le directeur de la publication est{" "}
          <Todo>[À COMPLÉTER — nom du représentant légal]</Todo>, en qualité de{" "}
          <Todo>[À COMPLÉTER — Président, Gérant…]</Todo>.
        </p>
      </LegalSection>

      <LegalSection n={3} title="Hébergement">
        <p>Le site est hébergé par :</p>
        <ul>
          <li>
            Hébergeur : <Todo>[À COMPLÉTER — ex. Hetzner, OVH, Scaleway…]</Todo>
          </li>
          <li>
            Adresse : <Todo>[À COMPLÉTER]</Todo>
          </li>
          <li>
            Téléphone : <Todo>[À COMPLÉTER]</Todo>
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
          <Todo>[À COMPLÉTER — adresse e-mail]</Todo>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
