const STEPS = [
  {
    n: "01",
    title: "Choisissez votre document",
    text: "Fiche de paie, contrat, quittance, statuts… Sélectionnez le document dont vous avez besoin.",
  },
  {
    n: "02",
    title: "Remplissez le formulaire guidé",
    text: "Un formulaire simple, ou laissez l'assistant IA vous poser les questions une à une.",
  },
  {
    n: "03",
    title: "Payez et téléchargez",
    text: "Paiement sécurisé si besoin, puis votre PDF conforme se télécharge immédiatement.",
  },
];

export function Etapes() {
  return (
    <section id="etapes" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-or text-sm font-bold uppercase tracking-[0.16em]">
            Comment ça marche
          </p>
          <h2 className="font-display text-noir mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Votre document en 3 étapes
          </h2>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center md:text-left">
              <span className="font-display text-or/30 text-5xl font-extrabold">
                {s.n}
              </span>
              <h3 className="font-display text-noir mt-3 text-xl font-bold tracking-tight">
                {s.title}
              </h3>
              <p className="text-gris mt-2 leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
