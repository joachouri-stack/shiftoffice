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
  representantNom?: string;
  representantQualite?: string;
};

// Entreprise identifiée dans la liste multi-entreprises de l'espace.
export type LocalEntrepriseItem = LocalEntreprise & { id: string };

/** Nombre maximal d'entreprises dans l'espace local. */
export const MAX_ENTREPRISES = 10;

export type LocalSalarie = {
  id: string;
  nom: string;
  poste?: string;
  salaireBrut?: number;
  typeContrat?: string;
  numeroSecu?: string;
  dateEntree?: string;
  classification?: string;
  email?: string;
  adresse?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  nationalite?: string;
};

export type LocalFiche = {
  id: string;
  salarieId?: string;
  salarieNom: string;
  periode: string; // ex. "Juin 2026"
  mois?: string;
  annee?: string;
  brut: number;
  net: number;
  // Entrées mémorisées pour la reprise du mois suivant
  heures?: string;
  heuresSup?: number;
  primes?: number;
  conges?: number;
  creeLe: string; // ISO
};

export type LocalBien = {
  id: string;
  bailleurNom: string;
  bailleurAdresse?: string;
  locataire: string;
  adresseBien?: string;
  loyer?: number;
  charges?: number;
  ville?: string;
};

// Journal générique de tous les documents générés (tous types confondus).
export type LocalDoc = {
  id: string;
  type: string; // slug du document
  titre: string; // libellé du type, ex. « Fiche de paie »
  libelle?: string; // contexte, ex. « Cherryne Tossou · Juin 2026 »
  montant?: number; // montant à afficher si pertinent
  refaireHref?: string; // lien pour régénérer
  creeLe: string; // ISO
};

const K = {
  entreprise: "so.entreprise", // héritage : entreprise unique (migrée vers la liste)
  entreprises: "so.entreprises",
  entrepriseActive: "so.entrepriseActive",
  salaries: "so.salaries",
  fiches: "so.fiches",
  biens: "so.biens",
  documents: "so.documents",
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
    // Notifie la synchronisation cloud (et l'UI) qu'une donnée a changé.
    window.dispatchEvent(new CustomEvent("so:change", { detail: key }));
  } catch {
    // quota plein ou navigation privée : on ignore silencieusement
  }
}

// Identifiant simple sans dépendance (évite Math.random/Date côté SSR).
function uid(): string {
  return "id-" + Math.random().toString(36).slice(2, 10);
}

/**
 * Liste des entreprises, avec migration automatique de l'ancienne entreprise
 * unique (clé « so.entreprise ») vers la liste au premier accès.
 */
function readEntreprises(): LocalEntrepriseItem[] {
  const list = read<LocalEntrepriseItem[]>(K.entreprises, []);
  if (list.length > 0) return list;
  const legacy = read<LocalEntreprise | null>(K.entreprise, null);
  if (legacy && legacy.nom) {
    const item = { ...legacy, id: uid() };
    write(K.entreprises, [item]);
    write(K.entrepriseActive, item.id);
    return [item];
  }
  return [];
}

function activeEntrepriseId(list: LocalEntrepriseItem[]): string | null {
  if (!list.length) return null;
  const id = read<string | null>(K.entrepriseActive, null);
  return list.some((e) => e.id === id) ? id : list[0].id;
}

export const localStore = {
  /** Entreprise active (celle utilisée par les documents). */
  getEntreprise: (): LocalEntreprise | null => {
    const list = readEntreprises();
    const id = activeEntrepriseId(list);
    return list.find((e) => e.id === id) ?? null;
  },
  /** Met à jour l'entreprise active (ou crée la première). */
  setEntreprise: (e: LocalEntreprise | null) => {
    write(K.entreprise, e); // héritage, conservé pour compat
    if (!e) return;
    const list = readEntreprises();
    const id = activeEntrepriseId(list);
    if (id) {
      write(
        K.entreprises,
        list.map((x) => (x.id === id ? { ...x, ...e } : x))
      );
    } else {
      const item = { ...e, id: uid() };
      write(K.entreprises, [item]);
      write(K.entrepriseActive, item.id);
    }
  },

  getEntreprises: (): LocalEntrepriseItem[] => readEntreprises(),
  getEntrepriseActiveId: (): string | null =>
    activeEntrepriseId(readEntreprises()),
  setEntrepriseActive: (id: string) => {
    const list = readEntreprises();
    if (list.some((e) => e.id === id)) write(K.entrepriseActive, id);
  },
  /** Ajoute une entreprise (max MAX_ENTREPRISES). Renvoie null si plafond atteint. */
  addEntreprise: (e: LocalEntreprise): LocalEntrepriseItem | null => {
    const list = readEntreprises();
    if (list.length >= MAX_ENTREPRISES) return null;
    const item = { ...e, id: uid() };
    write(K.entreprises, [...list, item]);
    write(K.entrepriseActive, item.id); // la nouvelle devient l'active
    return item;
  },
  updateEntreprise: (id: string, patch: Partial<LocalEntreprise>) => {
    write(
      K.entreprises,
      readEntreprises().map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  },
  removeEntreprise: (id: string) => {
    const rest = readEntreprises().filter((e) => e.id !== id);
    write(K.entreprises, rest);
    const active = read<string | null>(K.entrepriseActive, null);
    if (active === id) write(K.entrepriseActive, rest[0]?.id ?? null);
  },

  getSalaries: () => read<LocalSalarie[]>(K.salaries, []),
  addSalarie: (s: Omit<LocalSalarie, "id">) => {
    const list = read<LocalSalarie[]>(K.salaries, []);
    const item = { ...s, id: uid() };
    write(K.salaries, [...list, item]);
    return item;
  },
  updateSalarie: (id: string, patch: Partial<Omit<LocalSalarie, "id">>) => {
    write(
      K.salaries,
      read<LocalSalarie[]>(K.salaries, []).map((s) =>
        s.id === id ? { ...s, ...patch } : s
      )
    );
  },
  removeSalarie: (id: string) => {
    write(
      K.salaries,
      read<LocalSalarie[]>(K.salaries, []).filter((s) => s.id !== id)
    );
  },

  // Une fiche existe-t-elle déjà pour ce salarié sur cette période ?
  ficheExiste: (salarieId: string, periode: string) =>
    read<LocalFiche[]>(K.fiches, []).some(
      (f) => f.salarieId === salarieId && f.periode === periode
    ),

  getFiches: () => read<LocalFiche[]>(K.fiches, []),
  // Dernière fiche enregistrée pour un salarié (les plus récentes en tête).
  lastFicheForSalarie: (salarieId: string) =>
    read<LocalFiche[]>(K.fiches, []).find((f) => f.salarieId === salarieId) ?? null,
  addFiche: (f: Omit<LocalFiche, "id">) => {
    const list = read<LocalFiche[]>(K.fiches, []);
    const item = { ...f, id: uid() };
    write(K.fiches, [item, ...list]);
    return item;
  },

  getDocuments: () => read<LocalDoc[]>(K.documents, []),
  addDocument: (d: Omit<LocalDoc, "id">) => {
    const list = read<LocalDoc[]>(K.documents, []);
    const item = { ...d, id: uid() };
    write(K.documents, [item, ...list].slice(0, 50));
    return item;
  },

  getBiens: () => read<LocalBien[]>(K.biens, []),
  addBien: (b: Omit<LocalBien, "id">) => {
    const list = read<LocalBien[]>(K.biens, []);
    const item = { ...b, id: uid() };
    write(K.biens, [...list, item]);
    return item;
  },
  removeBien: (id: string) => {
    write(K.biens, read<LocalBien[]>(K.biens, []).filter((b) => b.id !== id));
  },

  clearAll: () => {
    if (!isBrowser()) return;
    [
      K.entreprise,
      K.entreprises,
      K.entrepriseActive,
      K.salaries,
      K.fiches,
      K.biens,
      K.documents,
    ].forEach((k) => window.localStorage.removeItem(k));
  },
};
