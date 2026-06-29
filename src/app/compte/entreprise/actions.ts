"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addEntreprise(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const champ = (k: string) => (formData.get(k) as string | null)?.trim() ?? "";
  const nom = champ("nom");
  if (!nom) redirect("/compte/entreprise?erreur=nom");

  const { error } = await supabase.from("entreprises").insert({
    user_id: user.id,
    nom,
    adresse: champ("adresse"),
    siret: champ("siret"),
    representant_nom: champ("representant_nom"),
    representant_qualite: champ("representant_qualite"),
    ville: champ("ville"),
  });

  if (error) {
    console.error("addEntreprise:", error.message);
    redirect(`/compte/entreprise?erreur=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/compte/entreprise");
  revalidatePath("/compte");
  redirect("/compte/entreprise?ok=1");
}

export async function deleteEntreprise(formData: FormData) {
  const id = formData.get("id") as string | null;
  if (!id) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("entreprises").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/compte/entreprise");
  revalidatePath("/compte");
}
