import type { Metadata } from "next";
import Flow from "./flow";

export const metadata: Metadata = {
  title: "Reçu pour solde de tout compte en ligne",
  description:
    "Générez un reçu pour solde de tout compte conforme : salaire dû, congés payés, indemnités — PDF immédiat. 3 €, sans abonnement.",
};

export default function Page() {
  return <Flow />;
}
