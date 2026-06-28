import { Timer, Files, ShieldCheck, Wallet } from "lucide-react";

const STATS = [
  { icon: Timer, value: "2 min", label: "pour générer" },
  { icon: Files, value: "9+", label: "documents légaux" },
  { icon: ShieldCheck, value: "100%", label: "conforme 2026" },
  { icon: Wallet, value: "0€", label: "sans abonnement" },
];

export function Stats() {
  return (
    <section className="bg-noir">
      <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="border-or/15 grid grid-cols-2 gap-3 rounded-2xl border bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-3 sm:grid-cols-4 sm:gap-0 sm:p-0">
          {STATS.map((s, i) => (
            <div
              key={s.value}
              className={`flex items-center gap-3.5 rounded-xl bg-white/[0.02] px-4 py-5 sm:rounded-none sm:bg-transparent sm:px-6 sm:py-7 ${
                i > 0 ? "sm:border-l sm:border-white/10" : ""
              }`}
            >
              <span className="bg-or/12 text-or grid h-10 w-10 shrink-0 place-items-center rounded-full">
                <s.icon size={18} />
              </span>
              <div className="min-w-0">
                <p className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  {s.value}
                </p>
                <p className="text-xs leading-tight text-white/45">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
