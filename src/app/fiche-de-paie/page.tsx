import type { Metadata } from "next";
import Flow from "./flow";

export const metadata: Metadata = {
  title: "Fiche de paie en ligne conforme 2026",
  description:
    "Générez une fiche de paie conforme en 2 minutes : cotisations URSSAF 2026 calculées automatiquement, PDF téléchargeable immédiatement. 8 €, sans abonnement.",
};

export default function Page() {
  return <Flow />;
}
