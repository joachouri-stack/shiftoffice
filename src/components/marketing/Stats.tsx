const STATS = [
  { value: "2 min", label: "pour générer un document" },
  { value: "9+", label: "types de documents" },
  { value: "100%", label: "conforme à la législation française" },
  { value: "0€", label: "d'abonnement requis" },
];

export function Stats() {
  return (
    <section className="bg-noir border-t border-white/10">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {STATS.map((s) => (
          <div key={s.value} className="px-4 py-10 text-center">
            <p className="font-display text-or text-4xl font-extrabold tracking-tight sm:text-5xl">
              {s.value}
            </p>
            <p className="mx-auto mt-2 max-w-[180px] text-sm leading-snug text-white/45">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
