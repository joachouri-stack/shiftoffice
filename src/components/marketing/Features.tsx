import {
  Sparkles,
  FileText,
  ShieldCheck,
  FolderClosed,
  Clock,
  Zap,
} from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Assistant IA",
    text: "Posez vos questions, rédigez vos documents, organisez votre journée. L'IA s'occupe des tâches répétitives à votre place.",
  },
  {
    icon: FileText,
    title: "Devis & Factures",
    text: "Créez des documents professionnels en quelques secondes. Propres, clairs, prêts à envoyer à vos clients.",
  },
  {
    icon: FolderClosed,
    title: "Documents centralisés",
    text: "Tous vos fichiers au même endroit. Retrouvez n'importe quel document en un instant, où que vous soyez.",
  },
  {
    icon: ShieldCheck,
    title: "Coffre-fort sécurisé",
    text: "Vos documents importants à l'abri. Chiffrés, sauvegardés, accessibles uniquement par vous.",
  },
  {
    icon: Clock,
    title: "Gain de temps réel",
    text: "Plusieurs heures économisées chaque semaine. Concentrez-vous sur votre métier, pas sur la paperasse.",
  },
  {
    icon: Zap,
    title: "Rapide & fluide",
    text: "Une interface pensée pour le terrain. Simple sur mobile, puissante sur ordinateur. Toujours instantanée.",
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
