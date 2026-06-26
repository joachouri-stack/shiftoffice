import Link from "next/link";
import { ArrowLeft, Sparkles, FileText, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

const PERKS = [
  { icon: Sparkles, text: "Un collaborateur IA qui rédige vos devis" },
  { icon: FileText, text: "Devis & factures professionnels en secondes" },
  { icon: ShieldCheck, text: "Vos documents en sécurité, accessibles partout" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      {/* Panneau de marque (desktop) */}
      <aside className="bg-ink relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 20% 0%, rgba(255,107,43,0.28) 0%, transparent 60%), radial-gradient(50% 40% at 100% 100%, rgba(255,107,43,0.18) 0%, transparent 60%)",
          }}
        />
        <div className="relative">
          <Logo theme="dark" size="lg" />
        </div>
        <div className="relative">
          <h2 className="text-paper max-w-md font-serif text-4xl font-medium leading-tight">
            L&apos;IA qui travaille pour votre entreprise.
          </h2>
          <ul className="mt-10 space-y-4">
            {PERKS.map((p) => (
              <li key={p.text} className="flex items-center gap-3">
                <span className="bg-brand/15 text-brand inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                  <p.icon size={18} />
                </span>
                <span className="text-[0.95rem] text-white/80">{p.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/40">
          Conçu pour les artisans du bâtiment.
        </p>
      </aside>

      {/* Colonne formulaire */}
      <div className="bg-glow relative flex min-h-dvh flex-col lg:min-h-0">
        <div className="bg-grid absolute inset-0 -z-10 opacity-50 lg:hidden" />
        <header className="flex items-center justify-between px-5 py-5 sm:px-8">
          <span className="lg:hidden">
            <Logo size="md" />
          </span>
          <span className="hidden lg:block" />
          <Link
            href="/"
            className="text-muted hover:text-ink inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Retour
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-5 py-8 sm:py-12">
          <div className="reveal w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
