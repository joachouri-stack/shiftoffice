import type { Metadata } from "next";
import Flow from "./flow";

export const metadata: Metadata = {
  title: "Statuts de société SASU, EURL, SARL en ligne",
  description:
    "Générez les statuts de votre société (SARL, EURL, SAS, SASU) : capital, associés, objet social rédigé par IA. PDF immédiat, 19 €.",
};

export default function Page() {
  return <Flow />;
}
