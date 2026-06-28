export function CtaFinal() {
  return (
    <section className="bg-noir relative overflow-hidden px-6 py-24 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60%]"
        style={{
          background:
            "radial-gradient(50% 100% at 50% 0%, rgba(201,162,75,0.18) 0%, transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          Votre premier document en{" "}
          <span className="text-or">2 minutes.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/55">
          Sans abonnement. Sans engagement. Payez uniquement ce dont vous avez
          besoin.
        </p>
        <div className="mt-9 flex justify-center">
          <a
            href="#produits"
            className="bg-or hover:bg-or-d inline-flex items-center gap-2.5 rounded-[10px] px-9 py-4 text-base font-bold text-white shadow-[0_4px_16px_rgba(201,162,75,0.35)] transition-all hover:-translate-y-0.5"
          >
            Générer mon premier document
            <span aria-hidden className="text-lg">
              →
            </span>
          </a>
        </div>
        <p className="mt-5 text-sm text-white/30">
          Paiement sécurisé Stripe · PDF conforme · Disponible 24h/24
        </p>
      </div>
    </section>
  );
}
