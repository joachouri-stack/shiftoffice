import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Footer } from "@/components/marketing/Footer";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-creme min-h-dvh">
      <header className="bg-noir">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo theme="dark" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft size={16} />
            Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-display text-noir text-3xl font-extrabold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="text-gris mt-2 text-sm">
          Dernière mise à jour : {updated}
        </p>
        <div className="legal-prose mt-8">{children}</div>
      </main>

      <Footer />
    </div>
  );
}

/** Section titrée d'une page légale. */
export function LegalSection({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="font-display text-noir text-lg font-bold">
        {n}. {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

/** Encadré « à compléter » pour les informations propres à l'éditeur. */
export function Todo({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-or/15 text-or-d rounded px-1.5 py-0.5 text-sm font-semibold">
      {children}
    </span>
  );
}
