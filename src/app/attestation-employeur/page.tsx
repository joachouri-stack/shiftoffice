import type { Metadata } from "next";
import Flow from "./flow";

export const metadata: Metadata = {
  title: "Attestation employeur gratuite en PDF",
  description:
    "Générez une attestation employeur officielle gratuitement, sans compte : remplissez le formulaire, téléchargez le PDF immédiatement.",
};

export default function Page() {
  return <Flow />;
}
