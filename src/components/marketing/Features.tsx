import {
  Sparkles,
  FileText,
  ShieldCheck,
  Package,
  BarChart3,
  Building2,
} from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Assistant IA bâtiment",
    text: "Dialoguez naturellement : « Prépare un devis », « Réponds à ce client », « Calcule ma TVA ». Un vrai collaborateur spécialisé.",
  },
  {
    icon: FileText,
    title: "Devis, factures & documents",
    text: "Devis, factures, contrats, fiches de paie, quittances — générés en quelques secondes, à votre charte.",
  },
  {
    icon: Package,
    title: "Bibliothèque produits",
    text: "Vos matériaux (prix, référence, fournisseur, TVA, photo) réutilisés automatiquement dans vos devis.",
  },
  {
    icon: Building2,
    title: "Profil entreprise",
    text: "Logo, SIRET, TVA, coordonnées : renseignés une fois, repris automatiquement sur tous vos documents.",
  },
  {
    icon: BarChart3,
    title: "Tableau de bord",
    text: "Chiffre d'affaires, marges, bénéfices, TVA et évolution — d'un coup d'œil, sans tableur.",
  },
  {
    icon: ShieldCheck,
    title: "Coffre-fort sécurisé",
    text: "Tous vos documents au même endroit, chiffrés. Retrouvez n'importe quel fichier en un instant.",
  },
];

export function Features() {
  return (
    <Section id="fonctionnalites">
      <SectionHeading
        eyebrow="Fonctionnalités"
        title="Moins de paperasse. Plus de chantiers."
        subtitle="Chaque fonctionnalité répond à une seule question : est-ce que ça vous fait gagner du temps ?"
      />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title} interactive className="p-6 sm:p-7">
            <div className="bg-brand-50 text-brand inline-flex h-12 w-12 items-center justify-center rounded-2xl">
              <f.icon size={22} />
            </div>
            <h3 className="text-ink mt-5 text-lg font-semibold tracking-tight">
              {f.title}
            </h3>
            <p className="text-muted mt-2 text-[0.95rem] leading-relaxed">
              {f.text}
            </p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
