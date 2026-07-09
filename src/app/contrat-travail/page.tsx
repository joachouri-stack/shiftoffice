import type { Metadata } from "next";
import Flow from "./flow";

export const metadata: Metadata = {
  title: "Contrat de travail CDI ou CDD en ligne",
  description:
    "Rédigez un contrat de travail CDI ou CDD avec toutes les clauses légales obligatoires : période d'essai, convention collective, PDF immédiat. 5 €.",
};

export default function Page() {
  return <Flow />;
}
