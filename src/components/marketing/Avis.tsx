import { Star } from "lucide-react";

type Review = {
  text: string;
  name: string;
  role: string;
  doc: string;
  initials: string;
};

const REVIEWS: Review[] = [
  {
    text: "Fiche de paie générée en 3 minutes, conforme et bien présentée.",
    name: "Marie D.",
    role: "Gérante PME",
    doc: "Fiche de paie",
    initials: "MD",
  },
  {
    text: "Plus besoin d'appeler mon comptable pour un contrat CDD.",
    name: "Karim B.",
    role: "Artisan",
    doc: "Contrat de travail",
    initials: "KB",
  },
  {
    text: "La quittance gratuite m'a sauvé la mise un dimanche soir.",
    name: "Sophie L.",
    role: "Propriétaire",
    doc: "Quittance de loyer",
    initials: "SL",
  },
  {
    text: "Rupture conventionnelle avec CERFA inclus, impeccable.",
    name: "Thomas M.",
    role: "DRH TPE",
    doc: "Rupture conventionnelle",
    initials: "TM",
  },
  {
    text: "Simple, rapide et conforme. Exactement ce dont j'avais besoin.",
    name: "Nadia R.",
    role: "Auto-entrepreneuse",
    doc: "Attestation employeur",
    initials: "NR",
  },
  {
    text: "Statuts SASU générés en 10 minutes pour 19€. Incroyable.",
    name: "Alexandre P.",
    role: "Créateur d'entreprise",
    doc: "Statuts de société",
    initials: "AP",
  },
];

export function Avis() {
  return (
    <section className="bg-creme py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-or text-sm font-bold uppercase tracking-[0.16em]">
            Ils nous font confiance
          </p>
          <h2 className="font-display text-noir mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ce qu'en disent nos clients
          </h2>
        </div>

        {/* Scroll horizontal sur mobile, grille sur desktop */}
        <div className="mt-12 flex snap-x gap-5 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3">
          {REVIEWS.map((r) => (
            <article
              key={r.name}
              className="border-or/20 w-[85vw] max-w-sm shrink-0 snap-start rounded-xl border bg-white p-6 shadow-sm sm:w-auto sm:max-w-none"
            >
              <div className="text-or flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <p className="text-noir mt-3 leading-relaxed">
                &laquo;&nbsp;{r.text}&nbsp;&raquo;
              </p>
              <div className="mt-5 flex items-center gap-3">
                <span className="bg-or/15 text-or-d font-display grid h-10 w-10 place-items-center rounded-full text-sm font-bold">
                  {r.initials}
                </span>
                <div>
                  <p className="text-noir text-sm font-bold">{r.name}</p>
                  <p className="text-gris text-xs">
                    {r.role} · {r.doc}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
