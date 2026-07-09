import type { Metadata } from "next";
import Flow from "./flow";

export const metadata: Metadata = {
  title: "Lettre de licenciement conforme en ligne",
  description:
    "Rédigez une lettre de licenciement conforme : délais légaux vérifiés, indemnité et préavis calculés, assistance IA pour les motifs. PDF immédiat, 12 €.",
};

export default function Page() {
  return <Flow />;
}
