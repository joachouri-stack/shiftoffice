"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function num(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function addSalarie(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const champ = (k: string) => (formData.get(k) as string | null)?.trim() ?? "";
  const nom = champ("nom");
  if (!nom) return;

  await supabase.from("salaries").insert({
    user_id: user.id,
    nom,
    poste: champ("poste"),
    numero_secu: champ("numero_secu"),
    salaire_brut: num(formData.get("salaire_brut")),
    date_embauche: champ("date_embauche"),
  });

  revalidatePath("/compte/salaries");
  revalidatePath("/compte");
}

export async function deleteSalarie(formData: FormData) {
  const id = formData.get("id") as string | null;
  if (!id) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("salaries").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/compte/salaries");
  revalidatePath("/compte");
}
