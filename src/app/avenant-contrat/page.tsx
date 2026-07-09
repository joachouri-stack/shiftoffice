import type { Metadata } from "next";
import Flow from "./flow";

export const metadata: Metadata = {
  title: "Avenant au contrat de travail en ligne",
  description:
    "Rédigez un avenant au contrat : augmentation, changement de poste, temps partiel, prolongation CDD — contrôles SMIC inclus. PDF immédiat, 5 €.",
};

export default function Page() {
  return <Flow />;
}
