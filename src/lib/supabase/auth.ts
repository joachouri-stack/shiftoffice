import type { User } from "@supabase/supabase-js";
import { createClient } from "./server";
import { isSupabaseEnabled } from "./config";

/** Retourne l'utilisateur connecté, ou null (y compris si Supabase est désactivé). */
export async function getUser(): Promise<User | null> {
  if (!isSupabaseEnabled()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
