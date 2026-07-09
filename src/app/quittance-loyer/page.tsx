import type { Metadata } from "next";
import Flow from "./flow";

export const metadata: Metadata = {
  title: "Quittance de loyer gratuite en PDF",
  description:
    "Générez une quittance de loyer gratuite pour votre locataire : loyer, charges et total calculés, PDF immédiat, sans compte.",
};

export default function Page() {
  return <Flow />;
}
