import type { Metadata } from "next";
import Flow from "./flow";

export const metadata: Metadata = {
  title: "Certificat de travail gratuit en PDF",
  description:
    "Générez un certificat de travail officiel gratuitement, sans compte : mentions légales obligatoires incluses, PDF téléchargeable immédiatement.",
};

export default function Page() {
  return <Flow />;
}
