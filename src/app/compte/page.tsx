import Link from "next/link";
import { FileClock, Users, ArrowRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DOCUMENTS, formatPrice } from "@/lib/documents";

export const dynamic = "force-dynamic";

export default async function ComptePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const prenom =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "";

  const [{ count: nbDocs }, { count: nbSalaries }, { data: recent }] =
    await Promise.all([
      supabase
        .from("documents_historique")
        .select("*", { count: "exact", head: true }),
      supabase.from("salaries").select("*", { count: "exact", head: true }),
      supabase
        .from("documents_historique")
        .select("type,titre,created_at")
        .order("created_at", { ascending: false })
        .limit(4),
    ]);

  const suggestions = DOCUMENTS.slice(0, 3);

  return (
    <div>
      <h1 className="font-display text-noir text-2xl font-extrabold tracking-tight">
        Bonjour {prenom} 👋
      </h1>
      <p className="text-gris mt-1 text-sm">
        Voici un aperçu de votre activité sur Shift Office.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={<FileClock size={20} />}
          value={nbDocs ?? 0}
          label="Documents générés"
          href="/compte/historique"
        />
        <StatCard
          icon={<Users size={20} />}
          value={nbSalaries ?? 0}
          label="Salariés enregistrés"
          href="/compte/salaries"
        />
      </div>

      {/* Documents récents */}
      <div className="border-or/20 mt-6 rounded-2xl border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-noir text-lg font-bold">
            Documents récents
          </h2>
          <Link
            href="/compte/historique"
            className="text-orange text-sm font-semibold hover:underline"
          >
            Tout voir
          </Link>
        </div>
        {recent && recent.length > 0 ? (
          <ul className="divide-or/10 divide-y">
            {recent.map((d, i) => (
              <li key={i} className="flex items-center justify-between py-2.5">
                <span className="text-noir text-sm font-medium">
                  {d.titre ?? d.type}
                </span>
                <span className="text-gris text-xs">
                  {new Date(d.created_at).toLocaleDateString("fr-FR")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gris text-sm">
            Aucun document pour l&apos;instant.{" "}
            <Link href="/#produits" className="text-orange font-semibold">
              Générer mon premier document
            </Link>
            .
          </p>
        )}
      </div>

      {/* Suggestions */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-or-d" />
          <h2 className="font-display text-noir text-lg font-bold">
            Générer un document
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {suggestions.map((doc) => (
            <Link
              key={doc.slug}
              href={`/generer/${doc.slug}`}
              className="border-or/20 hover:border-or/50 group rounded-xl border bg-white p-4 transition-colors"
            >
              <p className="text-noir font-display font-bold">{doc.title}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-orange text-sm font-bold">
                  {formatPrice(doc.price)}
                </span>
                <ArrowRight
                  size={16}
                  className="text-gris transition-transform group-hover:translate-x-0.5"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  href,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="border-or/20 hover:border-or/50 flex items-center gap-4 rounded-2xl border bg-white p-5 transition-colors"
    >
      <div className="bg-or/15 text-or-d grid h-11 w-11 place-items-center rounded-xl">
        {icon}
      </div>
      <div>
        <p className="font-display text-noir text-2xl font-extrabold">{value}</p>
        <p className="text-gris text-sm">{label}</p>
      </div>
    </Link>
  );
}
