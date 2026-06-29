"use client";

/**
 * Espace local : persistance dans le navigateur (localStorage), sans compte ni
 * serveur. Convient à un utilisateur solo sur un appareil. Aucune donnée ne
 * quitte la machine. Une bascule vers un compte cloud (Supabase) pourra plus
 * tard migrer ces données.
 */

export type LocalEntreprise = {
  nom: string;
  siret?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  codeNaf?: string;
  effectif?: string;
  convention?: string;
};

export type LocalSalarie = {
  id: string;
  nom: string;
  poste?: string;
  salaireBrut?: number;
  typeContrat?: string;
  numeroSecu?: string;
  dateEntree?: string;
  classification?: string;
};

export type LocalFiche = {
  id: string;
  salarieNom: string;
  periode: string; // ex. "Juin 2026"
  brut: number;
  net: number;
  creeLe: string; // ISO
};

const K = {
  entreprise: "so.entreprise",
  salaries: "so.salaries",
  fiches: "so.fiches",
};

const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota plein ou navigation privée : on ignore silencieusement
  }
}

// Identifiant simple sans dépendance (évite Math.random/Date côté SSR).
function uid(): string {
  return "id-" + Math.random().toString(36).slice(2, 10);
}

export const localStore = {
  getEntreprise: () => read<LocalEntreprise | null>(K.entreprise, null),
  setEntreprise: (e: LocalEntreprise | null) => write(K.entreprise, e),

  getSalaries: () => read<LocalSalarie[]>(K.salaries, []),
  addSalarie: (s: Omit<LocalSalarie, "id">) => {
    const list = read<LocalSalarie[]>(K.salaries, []);
    const item = { ...s, id: uid() };
    write(K.salaries, [...list, item]);
    return item;
  },
  removeSalarie: (id: string) => {
    write(
      K.salaries,
      read<LocalSalarie[]>(K.salaries, []).filter((s) => s.id !== id)
    );
  },

  getFiches: () => read<LocalFiche[]>(K.fiches, []),
  addFiche: (f: Omit<LocalFiche, "id">) => {
    const list = read<LocalFiche[]>(K.fiches, []);
    const item = { ...f, id: uid() };
    write(K.fiches, [item, ...list]);
    return item;
  },

  clearAll: () => {
    if (!isBrowser()) return;
    [K.entreprise, K.salaries, K.fiches].forEach((k) =>
      window.localStorage.removeItem(k)
    );
  },
};
