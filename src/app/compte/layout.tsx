import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FileClock, Home, LogOut, Users, Building2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/auth";

const NAV = [
  { href: "/compte", label: "Tableau de bord", icon: Home },
  { href: "/compte/historique", label: "Mes documents", icon: FileClock },
  { href: "/compte/salaries", label: "Mes salariés", icon: Users },
  { href: "/compte/entreprise", label: "Mes entreprises", icon: Building2 },
];

export default async function CompteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseEnabled()) {
    return (
      <div className="bg-creme grid min-h-dvh place-items-center px-4 text-center">
        <div className="max-w-md">
          <div className="mb-6 flex justify-center">
            <Logo theme="light" />
          </div>
          <h1 className="font-display text-noir text-2xl font-extrabold">
            Espace compte bientôt disponible
          </h1>
          <p className="text-gris mt-2 text-sm">
            La connexion et l&apos;historique des documents seront activés très
            prochainement. En attendant, tous les documents restent générables
            sans compte.
          </p>
          <Link
            href="/"
            className="bg-noir mt-6 inline-flex items-center gap-2 rounded-[10px] px-6 py-3 text-sm font-bold text-white"
          >
            <ArrowLeft size={16} />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  const user = await getUser();
  if (!user) redirect("/connexion");

  const email = user.email ?? "";

  return (
    <div className="bg-creme min-h-dvh">
      <header className="bg-noir">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo theme="dark" />
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-white/60 sm:inline">{email}</span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 transition-colors hover:text-white"
              >
                <LogOut size={16} />
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-noir hover:bg-or/10 inline-flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors"
              >
                <item.icon size={17} className="text-or-d" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
