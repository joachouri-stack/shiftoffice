import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { saveEntreprise } from "./actions";

export const dynamic = "force-dynamic";

const FIELD =
  "border-or/30 bg-white text-noir placeholder:text-gris/50 focus:border-or focus:ring-or/15 h-11 w-full rounded-lg border px-3.5 text-sm outline-none transition-all focus:ring-4";

export default async function EntreprisePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .maybeSingle();

  const v = (k: string) => (profile?.[k] as string | undefined) ?? "";

  return (
    <div>
      <h1 className="font-display text-noir text-2xl font-extrabold tracking-tight">
        Mon entreprise
      </h1>
      <p className="text-gris mt-1 text-sm">
        Ces informations pré-rempliront automatiquement vos futurs documents.
      </p>

      {ok && (
        <div className="bg-vert-l text-vert mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold">
          <Check size={16} />
          Modifications enregistrées.
        </div>
      )}

      <form
        action={saveEntreprise}
        className="border-or/20 mt-6 space-y-5 rounded-2xl border bg-white p-6"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Label label="Nom de l'entreprise">
            <input name="entreprise_nom" defaultValue={v("entreprise_nom")} placeholder="Ex. Dupont Bâtiment" className={FIELD} />
          </Label>
          <Label label="SIRET">
            <input name="siret" defaultValue={v("siret")} placeholder="123 456 789 00012" className={FIELD} />
          </Label>
        </div>
        <Label label="Adresse de l'entreprise">
          <input name="entreprise_adresse" defaultValue={v("entreprise_adresse")} placeholder="12 rue des Artisans, 69003 Lyon" className={FIELD} />
        </Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Label label="Représentant légal">
            <input name="representant_nom" defaultValue={v("representant_nom")} placeholder="Ex. M. Dupont" className={FIELD} />
          </Label>
          <Label label="Qualité">
            <input name="representant_qualite" defaultValue={v("representant_qualite")} placeholder="Ex. Gérant" className={FIELD} />
          </Label>
        </div>
        <Label label="Ville (pour les signatures)">
          <input name="ville" defaultValue={v("ville")} placeholder="Lyon" className={FIELD} />
        </Label>

        <button
          type="submit"
          className="bg-orange hover:bg-orange-d inline-flex items-center justify-center gap-2 rounded-[10px] px-6 py-3 text-base font-bold text-white transition-colors"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}

function Label({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-noir mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
