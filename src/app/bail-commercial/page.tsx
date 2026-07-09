import type { Metadata } from "next";
import Flow from "./flow";

export const metadata: Metadata = {
  title: "Bail commercial 3-6-9 ou précaire en ligne",
  description:
    "Rédigez un bail commercial 3-6-9 ou un bail précaire complet : clauses obligatoires, matériel, pas-de-porte, révision ILC. PDF immédiat, 9 €.",
};

export default function Page() {
  return <Flow />;
}
