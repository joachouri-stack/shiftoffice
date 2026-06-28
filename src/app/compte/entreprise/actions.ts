"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveEntreprise(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const champ = (k: string) => (formData.get(k) as string | null)?.trim() ?? "";

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      entreprise_nom: champ("entreprise_nom"),
      entreprise_adresse: champ("entreprise_adresse"),
      siret: champ("siret"),
      representant_nom: champ("representant_nom"),
      representant_qualite: champ("representant_qualite"),
      ville: champ("ville"),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  revalidatePath("/compte/entreprise");
  revalidatePath("/compte");
  redirect("/compte/entreprise?ok=1");
}
