"use client";

/**
 * Synchronisation de l'espace local avec Supabase (table `espaces`).
 *
 * Principe : le localStorage reste la source de travail (l'app fonctionne
 * hors connexion et sans compte). Quand un utilisateur est connecté :
 *  - à l'ouverture / à la connexion : on récupère l'espace cloud, on le
 *    FUSIONNE avec les données locales (union par id — rien n'est perdu),
 *    on réécrit le tout localement puis on pousse le résultat ;
 *  - à chaque modification locale (événement « so:change ») : on repousse
 *    l'espace complet, avec un debounce de 2 s.
 *
 * Les PDF (IndexedDB) restent sur l'appareil — seules les données
 * (entreprises, salariés, fiches, biens, historique de documents) suivent
 * l'utilisateur.
 */

import { createClient } from "./client";
import { isSupabaseEnabled } from "./config";
import { clearAllPdfs } from "@/lib/local/pdfs";

const DATA_KEYS = [
  "so.entreprises",
  "so.entrepriseActive",
  "so.salaries",
  "so.fiches",
  "so.biens",
  "so.documents",
] as const;

/** Dernier compte synchronisé sur cet appareil (anti-fusion entre comptes). */
const LAST_USER_KEY = "so.lastUserId";

/** Efface toutes les données locales du site (localStorage so.* + PDF). */
function purgeLocal() {
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith("so.")) keys.push(k);
  }
  keys.forEach((k) => window.localStorage.removeItem(k));
  void clearAllPdfs().catch(() => {});
}

type Snapshot = Record<string, unknown>;

function readKey(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

export function snapshotLocal(): Snapshot {
  const out: Snapshot = {};
  for (const k of DATA_KEYS) {
    const v = readKey(k);
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function applySnapshot(data: Snapshot) {
  for (const k of DATA_KEYS) {
    if (data[k] === undefined) continue;
    try {
      window.localStorage.setItem(k, JSON.stringify(data[k]));
    } catch {
      /* best-effort */
    }
  }
  window.dispatchEvent(new CustomEvent("so:refresh"));
}

type WithId = { id?: string; creeLe?: string };

/** Union de deux listes par id — le local (activité la plus récente) gagne. */
function mergeList(remote: unknown, local: unknown): unknown[] {
  const r = Array.isArray(remote) ? (remote as WithId[]) : [];
  const l = Array.isArray(local) ? (local as WithId[]) : [];
  const byId = new Map<string, WithId>();
  for (const x of r) if (x && x.id) byId.set(x.id, x);
  for (const x of l) if (x && x.id) byId.set(x.id, x);
  return [...byId.values()];
}

/** Fusionne l'espace cloud et l'espace local sans rien perdre. */
export function mergeSnapshots(remote: Snapshot, local: Snapshot): Snapshot {
  const out: Snapshot = {};
  for (const k of DATA_KEYS) {
    if (k === "so.entrepriseActive") {
      out[k] = local[k] ?? remote[k];
      continue;
    }
    const merged = mergeList(remote[k], local[k]);
    if (k === "so.documents" || k === "so.fiches") {
      merged.sort((a, b) =>
        String((b as WithId).creeLe ?? "").localeCompare(String((a as WithId).creeLe ?? ""))
      );
      out[k] = merged.slice(0, 50);
    } else {
      out[k] = merged;
    }
  }
  return out;
}

let started = false;
let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Démarre la synchronisation (idempotent, appelé une fois au chargement de
 * l'app). Sans Supabase configuré ou sans session : ne fait rien.
 */
export function startEspaceSync(): void {
  if (started || !isSupabaseEnabled() || typeof window === "undefined") return;
  started = true;
  const supabase = createClient();

  const push = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("espaces").upsert({
      user_id: session.user.id,
      data: snapshotLocal(),
      updated_at: new Date().toISOString(),
    });
  };

  const pushDebounced = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void push().catch(() => {}), 2000);
  };

  const pullAndMerge = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    // Anti-fusion : si les données locales appartiennent à un AUTRE compte
    // (navigateur partagé), on les purge au lieu de les fusionner — les
    // salariés/salaires d'un compte ne doivent jamais fuiter vers un autre.
    const prev = window.localStorage.getItem(LAST_USER_KEY);
    if (prev && prev !== session.user.id) purgeLocal();
    window.localStorage.setItem(LAST_USER_KEY, session.user.id);
    const { data } = await supabase
      .from("espaces")
      .select("data")
      .eq("user_id", session.user.id)
      .maybeSingle();
    const remote = (data?.data ?? {}) as Snapshot;
    const merged = mergeSnapshots(remote, snapshotLocal());
    applySnapshot(merged);
    await push().catch(() => {});
  };

  // Session déjà ouverte au chargement, ou connexion en cours de route.
  void pullAndMerge().catch(() => {});
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN") void pullAndMerge().catch(() => {});
    // Déconnexion (y compris depuis un autre onglet) : on purge l'appareil.
    if (event === "SIGNED_OUT") purgeLocal();
  });

  window.addEventListener("so:change", pushDebounced);
}
