"use client";

import { useEffect } from "react";
import { startEspaceSync } from "@/lib/supabase/espace";

/** Démarre la synchronisation cloud de l'espace (no-op sans Supabase). */
export function SyncBoot() {
  useEffect(() => {
    startEspaceSync();
  }, []);
  return null;
}
