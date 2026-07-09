import type { Metadata } from "next";
import Flow from "./flow";

export const metadata: Metadata = {
  title: "Rupture conventionnelle en ligne (CERFA)",
  description:
    "Générez la convention de rupture conventionnelle avec indemnité légale calculée et rappel des délais officiels. PDF immédiat, 5 €.",
};

export default function Page() {
  return <Flow />;
}
