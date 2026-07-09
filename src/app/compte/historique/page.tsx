import Link from "next/link";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, flowHref } from "@/lib/documents";

export const dynamic = "force-dynamic";

type Ligne = {
  id: string;
  type: string;
  titre: string | null;
  prix: number | null;
  created_at: string;
};

export default async function HistoriquePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents_historique")
    .select("id,type,titre,prix,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const lignes = (data ?? []) as Ligne[];

  return (
    <div>
      <h1 className="font-display text-noir text-2xl font-extrabold tracking-tight">
        Mes documents
      </h1>
      <p className="text-gris mt-1 text-sm">
        L&apos;historique des documents que vous avez générés. Pour des raisons
        de confidentialité, seul le suivi est conservé — pas le contenu des
        documents.
      </p>

      <div className="border-or/20 mt-6 rounded-2xl border bg-white">
        {lignes.length > 0 ? (
          <ul className="divide-or/10 divide-y">
            {lignes.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="bg-or/15 text-or-d grid h-9 w-9 shrink-0 place-items-center rounded-lg">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-noir truncate text-sm font-semibold">
                      {l.titre ?? l.type}
                    </p>
                    <p className="text-gris text-xs">
                      {new Date(l.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="text-gris text-xs">
                    {l.prix != null ? formatPrice(l.prix) : ""}
                  </span>
                  <Link
                    href={flowHref(l.type)}
                    className="text-orange text-sm font-semibold hover:underline"
                  >
                    Régénérer
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gris px-5 py-8 text-center text-sm">
            Aucun document généré pour l&apos;instant.{" "}
            <Link href="/#produits" className="text-orange font-semibold">
              Commencer
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
