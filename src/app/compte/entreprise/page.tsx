import { Building2, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { addEntreprise, deleteEntreprise } from "./actions";

export const dynamic = "force-dynamic";

const FIELD =
  "border-or/30 bg-white text-noir placeholder:text-gris/50 focus:border-or focus:ring-or/15 h-11 w-full rounded-lg border px-3.5 text-sm outline-none transition-all focus:ring-4";

type Entreprise = {
  id: string;
  nom: string;
  siret: string | null;
  ville: string | null;
  representant_nom: string | null;
};

export default async function EntreprisesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { ok, erreur } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("entreprises")
    .select("id,nom,siret,ville,representant_nom")
    .order("nom", { ascending: true });

  const list = (data ?? []) as Entreprise[];

  return (
    <div>
      <h1 className="font-display text-noir text-2xl font-extrabold tracking-tight">
        Mes entreprises
      </h1>
      <p className="text-gris mt-1 text-sm">
        Enregistrez vos entreprises pour pré-remplir vos documents plus vite.
      </p>

      {ok && (
        <div className="bg-vert-l text-vert mt-4 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold">
          Entreprise ajoutée.
        </div>
      )}
      {erreur && erreur !== "nom" && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          L&apos;enregistrement a échoué : {erreur}. (As-tu bien exécuté le SQL
          de création de la table&nbsp;?)
        </div>
      )}
      {erreur === "nom" && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          Le nom de l&apos;entreprise est obligatoire.
        </div>
      )}

      {/* Liste */}
      <div className="border-or/20 mt-6 rounded-2xl border bg-white p-2">
        {list.length > 0 ? (
          <ul className="divide-or/10 divide-y">
            {list.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="bg-or/15 text-or-d grid h-9 w-9 shrink-0 place-items-center rounded-lg">
                    <Building2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-noir truncate text-sm font-semibold">
                      {e.nom}
                    </p>
                    <p className="text-gris truncate text-xs">
                      {[e.ville, e.siret ? `SIRET ${e.siret}` : null]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                </div>
                <form action={deleteEntreprise}>
                  <input type="hidden" name="id" value={e.id} />
                  <button
                    type="submit"
                    aria-label={`Supprimer ${e.nom}`}
                    className="text-gris hover:bg-red-50 hover:text-red-600 grid h-9 w-9 place-items-center rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gris px-4 py-6 text-center text-sm">
            Aucune entreprise enregistrée pour l&apos;instant.
          </p>
        )}
      </div>

      {/* Ajouter */}
      <div className="border-or/20 mt-6 rounded-2xl border bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Plus size={18} className="text-or-d" />
          <h2 className="font-display text-noir text-lg font-bold">
            Ajouter une entreprise
          </h2>
        </div>
        <form action={addEntreprise} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="nom" required placeholder="Nom de l'entreprise *" className={FIELD} />
            <input name="siret" placeholder="SIRET" className={FIELD} />
          </div>
          <input name="adresse" placeholder="Adresse" className={FIELD} />
          <div className="grid gap-3 sm:grid-cols-3">
            <input name="representant_nom" placeholder="Représentant" className={FIELD} />
            <input name="representant_qualite" placeholder="Qualité (Gérant…)" className={FIELD} />
            <input name="ville" placeholder="Ville" className={FIELD} />
          </div>
          <button
            type="submit"
            className="bg-orange hover:bg-orange-d inline-flex items-center justify-center gap-2 rounded-[10px] px-6 py-3 text-base font-bold text-white transition-colors"
          >
            <Plus size={18} />
            Ajouter l&apos;entreprise
          </button>
        </form>
      </div>
    </div>
  );
}
