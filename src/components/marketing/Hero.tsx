const POINTS = [
  "Conforme URSSAF 2026",
  "PDF immédiat",
  "Sans abonnement",
  "Paiement sécurisé",
];

const TRUST = [
  "Aucun abonnement requis",
  "PDF téléchargeable immédiatement",
  "Législation française 2026",
];

export function Hero() {
  return (
    <section className="bg-noir relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      {/* Halos doré + orange */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[20%] -left-[10%] h-[60%] w-[60%]"
        style={{
          background:
            "radial-gradient(ellipse, rgba(201,162,75,0.12) 0%, transparent 68%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[10%] -right-[5%] h-[50%] w-[50%]"
        style={{
          background:
            "radial-gradient(ellipse, rgba(255,107,43,0.09) 0%, transparent 68%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[720px] text-center">
        {/* Badge */}
        <div className="border-or/30 bg-or/10 text-or mb-7 inline-flex items-center gap-2 rounded-full border px-[18px] py-[7px] text-[0.7rem] font-bold uppercase tracking-[0.16em]">
          <span className="bg-or animate-pulse-dot h-1.5 w-1.5 rounded-full" />
          ✦ Documents officiels — Conformes 2026
        </div>

        {/* Titre */}
        <h1 className="font-display text-[clamp(3rem,6vw,5rem)] font-extrabold leading-[1.04] tracking-[-0.025em] text-white">
          Vos documents <span className="text-orange">légaux</span>
          <br />
          en <span className="text-or">2 minutes.</span>
        </h1>

        {/* Sous-titre principal */}
        <p className="font-display mt-3.5 text-xl font-bold tracking-[-0.01em] text-white/90 sm:text-2xl">
          Sans comptable, sans erreur, sans prise de tête.
        </p>

        {/* Sous-titre secondaire */}
        <p className="mx-auto mt-3.5 max-w-[480px] text-base leading-[1.75] text-white/45">
          Fiches de paie, contrats, quittances… Remplissez un formulaire simple,
          téléchargez votre PDF conforme immédiatement.
        </p>

        {/* Points */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2">
          {POINTS.map((p, i) => (
            <div key={p} className="flex items-center gap-2.5">
              <span className="text-sm font-semibold text-white/50">
                <span className="bg-or mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle" />
                {p}
              </span>
              {i < POINTS.length - 1 && (
                <span className="h-[3px] w-[3px] rounded-full bg-white/20" />
              )}
            </div>
          ))}
        </div>

        {/* Boutons */}
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#produits"
            className="bg-or hover:bg-or-d inline-flex w-full items-center justify-center gap-2.5 rounded-[10px] px-9 py-4 text-base font-bold text-white shadow-[0_4px_16px_rgba(201,162,75,0.35)] transition-all hover:-translate-y-0.5 sm:w-auto"
          >
            Générer mon document
            <span aria-hidden className="text-lg">
              →
            </span>
          </a>
          <a
            href="#produits"
            className="border-or/50 hover:border-or hover:bg-or/10 inline-flex w-full items-center justify-center rounded-[10px] border-2 px-7 py-4 text-base font-semibold text-white transition-all hover:-translate-y-0.5 sm:w-auto"
          >
            Voir tous les documents
          </a>
        </div>

        {/* Note de confiance */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[0.78rem] text-white/30">
          {TRUST.map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="text-or font-bold">✓</span>
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
