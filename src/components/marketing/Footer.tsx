import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const LEGAL = [
  { label: "CGV", href: "/cgv" },
  { label: "CGU", href: "/cgu" },
  { label: "Confidentialité", href: "/confidentialite" },
  { label: "Mentions légales", href: "/mentions-legales" },
];

export function Footer() {
  return (
    <footer className="bg-noir border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-12 text-center sm:px-6 lg:px-8">
        <Logo theme="dark" />
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {LEGAL.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-sm text-white/50 transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="text-sm text-white/30">
          © 2026 Shift Office — Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
