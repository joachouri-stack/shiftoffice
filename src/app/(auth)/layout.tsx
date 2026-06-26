import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-glow relative flex min-h-dvh flex-col">
      <div className="bg-grid absolute inset-0 -z-10 opacity-50" />

      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Logo size="md" />
        <Link
          href="/"
          className="text-muted hover:text-ink inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Retour
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-8 sm:py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
