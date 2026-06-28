import { Trash2, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { addSalarie, deleteSalarie } from "./actions";

export const dynamic = "force-dynamic";

const FIELD =
  "border-or/30 bg-white text-noir placeholder:text-gris/50 focus:border-or focus:ring-or/15 h-11 w-full rounded-lg border px-3.5 text-sm outline-none transition-all focus:ring-4";

type Salarie = {
  id: string;
  nom: string;
  poste: string | null;
  salaire_brut: number | null;
  date_embauche: string | null;
};

export default async function SalariesPage() {
  const supabase = await createClient();
  const { data: salaries } = await supabase
    .from("salaries")
    .select("id,nom,poste,salaire_brut,date_embauche")
    .order("nom", { ascending: true });

  const list = (salaries ?? []) as Salarie[];

  return (
    <div>
      <h1 className="font-display text-noir text-2xl font-extrabold tracking-tight">
        Mes salariés
      </h1>
      <p className="text-gris mt-1 text-sm">
        Enregistrez vos salariés pour générer leurs documents plus vite.
      </p>

      {/* Liste */}
      <div className="border-or/20 mt-6 rounded-2xl border bg-white p-2">
        {list.length > 0 ? (
          <ul className="divide-or/10 divide-y">
            {list.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-noir truncate text-sm font-semibold">
                    {s.nom}
                  </p>
                  <p className="text-gris truncate text-xs">
                    {[s.poste, s.salaire_brut ? `${s.salaire_brut} € brut` : null]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>
                <form action={deleteSalarie}>
                  <input type="hidden" name="id" value={s.id} />
                  <button
                    type="submit"
                    aria-label={`Supprimer ${s.nom}`}
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
            Aucun salarié enregistré pour l&apos;instant.
          </p>
        )}
      </div>

      {/* Ajouter */}
      <div className="border-or/20 mt-6 rounded-2xl border bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus size={18} className="text-or-d" />
          <h2 className="font-display text-noir text-lg font-bold">
            Ajouter un salarié
          </h2>
        </div>
        <form action={addSalarie} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="nom" required placeholder="Nom et prénom" className={FIELD} />
            <input name="poste" placeholder="Poste" className={FIELD} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input name="salaire_brut" inputMode="decimal" placeholder="Salaire brut (€)" className={FIELD} />
            <input name="date_embauche" placeholder="Date d'embauche" className={FIELD} />
            <input name="numero_secu" placeholder="N° sécu (optionnel)" className={FIELD} />
          </div>
          <button
            type="submit"
            className="bg-orange hover:bg-orange-d inline-flex items-center justify-center gap-2 rounded-[10px] px-6 py-3 text-base font-bold text-white transition-colors"
          >
            <UserPlus size={18} />
            Ajouter
          </button>
        </form>
      </div>
    </div>
  );
}
