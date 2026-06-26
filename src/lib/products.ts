"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Un produit/matériau de la bibliothèque de l'artisan. */
export type Product = {
  id: string;
  name: string;
  reference: string;
  supplier: string;
  unit: string; // u, m², ml, h, forfait, sac, kg, L…
  price: number; // prix unitaire HT en €
  vat: number; // taux de TVA (20, 10, 5.5)
  photo: string; // data URL (ou vide)
};

export const PRODUCT_UNITS = [
  "u",
  "m²",
  "ml",
  "m³",
  "h",
  "forfait",
  "sac",
  "kg",
  "L",
];

export const VAT_RATES = [20, 10, 5.5];

const STORAGE_KEY = "shiftoffice.products";
const EVENT = "shiftoffice:products";

let cache: Product[] | null = null;

function load(): Product[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Product[]) : [];
  } catch {
    return [];
  }
}

function getSnapshot(): Product[] {
  if (cache === null) cache = load();
  return cache;
}

const EMPTY: Product[] = [];
function getServerSnapshot(): Product[] {
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

function persist(products: Product[]) {
  cache = products;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch {
    // quota dépassé — ignoré
  }
  window.dispatchEvent(new Event(EVENT));
}

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `p_${Date.now().toString(36)}`;
}

/**
 * Hook React : bibliothèque produits, synchronisée entre composants.
 * Local-first, prête à basculer vers une persistance cloud (Supabase).
 */
export function useProducts() {
  const products = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const add = useCallback((p: Omit<Product, "id">) => {
    persist([{ ...p, id: newId() }, ...getSnapshot()]);
  }, []);

  const update = useCallback((id: string, patch: Omit<Product, "id">) => {
    persist(
      getSnapshot().map((p) => (p.id === id ? { ...patch, id } : p))
    );
  }, []);

  const remove = useCallback((id: string) => {
    persist(getSnapshot().filter((p) => p.id !== id));
  }, []);

  return { products, add, update, remove };
}
