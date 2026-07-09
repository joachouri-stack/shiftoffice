import type { Metadata } from "next";
import Flow from "./flow";

export const metadata: Metadata = {
  title: "Note de frais gratuite en PDF (TVA auto)",
  description:
    "Générez une note de frais professionnelle gratuite : TVA calculée automatiquement par ligne, totaux HT/TVA/TTC, PDF immédiat, sans compte.",
};

export default function Page() {
  return <Flow />;
}
