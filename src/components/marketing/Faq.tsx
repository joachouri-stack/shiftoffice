"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

const FAQ = [
  {
    q: "Les documents sont-ils vraiment conformes à la législation 2026 ?",
    a: "Oui. Tous nos documents sont mis à jour selon la législation française en vigueur. Les fiches de paie intègrent les taux URSSAF 2026, les contrats incluent toutes les clauses obligatoires, et les CERFA sont les versions officielles les plus récentes.",
  },
  {
    q: "Comment récupérer mon document après paiement ?",
    a: "Immédiatement après confirmation du paiement, votre PDF est généré et téléchargeable directement sur la page. Vous recevez également un email avec le lien. Si vous êtes connecté, le document est sauvegardé dans votre espace personnel.",
  },
  {
    q: "La quittance de loyer et l'attestation sont-elles vraiment gratuites ?",
    a: "Oui, totalement gratuites et sans limite. Aucun compte requis. Remplissez le formulaire, téléchargez le PDF.",
  },
  {
    q: "Dois-je créer un compte pour générer un document ?",
    a: "Pour les documents gratuits, aucun compte n'est requis. Pour les documents payants, une connexion Google est demandée afin de sauvegarder votre historique et activer la continuité IA entre vos fiches de paie.",
  },
  {
    q: "Qu'est-ce que la continuité IA pour les fiches de paie ?",
    a: "Si vous générez plusieurs fiches de paie pour le même employé, l'IA pré-remplit automatiquement la fiche suivante depuis la précédente. Salaire, cotisations, cumuls annuels — tout est repris et mis à jour. Vous n'avez qu'à vérifier.",
  },
  {
    q: "Puis-je modifier le PDF après génération ?",
    a: "Le PDF est généré en version finale non modifiable. Si une information est incorrecte, vous pouvez générer un nouveau document avec les données corrigées.",
  },
  {
    q: "Quels moyens de paiement sont acceptés ?",
    a: "Carte bancaire (Visa, Mastercard, American Express) via Stripe. Paiement 100% sécurisé.",
  },
  {
    q: "Puis-je obtenir un remboursement ?",
    a: "Si votre PDF est défaillant ou illisible, nous le remboursons intégralement sous 48h sur simple demande à contact@shiftoffice.fr.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-or text-sm font-bold uppercase tracking-[0.16em]">
            FAQ
          </p>
          <h2 className="font-display text-noir mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Les questions fréquentes
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className="border-or/20 overflow-hidden rounded-xl border bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="hover:bg-creme/60 flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors"
                >
                  <span className="font-display text-noir font-bold">
                    {item.q}
                  </span>
                  <Plus
                    size={20}
                    className={`text-or shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-gris px-5 pb-5 leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
