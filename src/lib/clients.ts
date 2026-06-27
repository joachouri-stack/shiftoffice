"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ClientType = "particulier" | "professionnel";

/** Un client du répertoire de l'artisan, réutilisable dans devis et factures. */
export type Client = {
  id: string;
  name: string;
  type: ClientType;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  siret: string;
  notes: string;
};

const STORAGE_KEY = "shiftoffice.clients";
const EVENT = "shiftoffice:clients";

let cache: Client[] | null = null;

function load(): Client[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Client[]) : [];
  } catch {
    return [];
  }
}

function getSnapshot(): Client[] {
  if (cache === null) cache = load();
  return cache;
}

const EMPTY: Client[] = [];
function getServerSnapshot(): Client[] {
  return EMPTY;
}

function subscribe(callback: () => void): () => void {
  const handler = () => {
    cache = load();
    callback();
  };
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function persist(clients: Client[]) {
  cache = clients;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  } catch {
    // quota dépassé — ignoré
  }
  window.dispatchEvent(new Event(EVENT));
}

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `c_${Date.now().toString(36)}`;
}

/**
 * Hook React : répertoire clients, synchronisé entre composants.
 * Local-first, prêt à basculer vers une persistance cloud (table `clients`).
 */
export function useClients() {
  const clients = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const add = useCallback((c: Omit<Client, "id">) => {
    persist([{ ...c, id: newId() }, ...getSnapshot()]);
  }, []);

  const update = useCallback((id: string, patch: Omit<Client, "id">) => {
    persist(getSnapshot().map((c) => (c.id === id ? { ...patch, id } : c)));
  }, []);

  const remove = useCallback((id: string) => {
    persist(getSnapshot().filter((c) => c.id !== id));
  }, []);

  return { clients, add, update, remove };
}
