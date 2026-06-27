"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { cn } from "@/lib/utils";

const FAQ = [
  {
    q: "Shift Office, c'est un logiciel de facturation ?",
    a: "Non. Shift Office est avant tout un assistant IA conçu pour les artisans. Il vous aide à gérer vos documents, devis et factures — mais sa mission première est de vous faire gagner du temps, pas de remplacer votre comptable.",
  },
  {
    q: "Faut-il être à l'aise avec l'informatique ?",
    a: "Absolument pas. L'interface est pensée pour le terrain : claire, simple et rapide. Tout se fait en langage naturel, comme une conversation.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Oui. Vos documents sensibles sont protégés dans un coffre-fort sécurisé, chiffrés et sauvegardés. Vous restez seul maître de vos informations.",
  },
  {
    q: "Ça fonctionne sur téléphone ?",
    a: "Parfaitement. Shift Office est conçu mobile-first : iPhone, Android, tablette ou ordinateur, l'expérience est toujours fluide et stable.",
  },
  {
    q: "Puis-je résilier à tout moment ?",
    a: "Oui, sans engagement. Vous pouvez tester gratuitement, puis arrêter quand vous le souhaitez, en un clic.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section id="faq" size="narrow">
      <SectionHeading
        eyebrow="FAQ"
        title="Les questions que vous vous posez"
      />

      <div className="mt-12 space-y-3">
        {FAQ.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={item.q}
              className="border-line bg-paper overflow-hidden rounded-2xl border"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="hover:bg-mist/60 flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors sm:px-6"
              >
                <span className="text-ink font-medium">{item.q}</span>
                <Plus
                  size={20}
                  className={cn(
                    "text-muted shrink-0 transition-transform duration-300",
                    isOpen && "rotate-45"
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-300 ease-out",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <p className="text-muted px-5 pb-5 leading-relaxed sm:px-6">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
