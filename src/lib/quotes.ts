"use client";

import { useCallback, useSyncExternalStore } from "react";
import { emptyQuote, type Quote } from "./quote-core";

export * from "./quote-core";

/* ============================================================
   STOCKAGE local-first (prêt pour synchro cloud — Supabase).
   ============================================================ */

function makeStore<T>(key: string, fallback: T) {
  let cache: T | null = null;
  const event = `shiftoffice:${key}`;
  const load = (): T => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  };
  return {
    getSnapshot(): T {
      if (cache === null) cache = load();
      return cache;
    },
    getServerSnapshot(): T {
      return fallback;
    },
    subscribe(cb: () => void) {
      const h = () => {
        cache = load();
        cb();
      };
      window.addEventListener(event, h);
      window.addEventListener("storage", h);
      return () => {
        window.removeEventListener(event, h);
        window.removeEventListener("storage", h);
      };
    },
    persist(value: T) {
      cache = value;
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* quota */
      }
      window.dispatchEvent(new Event(event));
    },
  };
}

const listStore = makeStore<Quote[]>("shiftoffice.quotes", []);
const draftStore = makeStore<Quote>("shiftoffice.quote.draft", emptyQuote());

/** Liste des devis/factures enregistrés (historique). */
export function useQuotes() {
  const quotes = useSyncExternalStore(
    listStore.subscribe,
    listStore.getSnapshot,
    listStore.getServerSnapshot
  );
  const save = useCallback((q: Quote) => {
    const list = listStore.getSnapshot();
    const exists = list.some((x) => x.id === q.id);
    listStore.persist(
      exists ? list.map((x) => (x.id === q.id ? q : x)) : [q, ...list]
    );
  }, []);
  const remove = useCallback((id: string) => {
    listStore.persist(listStore.getSnapshot().filter((x) => x.id !== id));
  }, []);
  return { quotes, save, remove };
}

/** Devis en cours d'édition (persisté pour survivre au rechargement). */
export function useDraftQuote() {
  const draft = useSyncExternalStore(
    draftStore.subscribe,
    draftStore.getSnapshot,
    draftStore.getServerSnapshot
  );
  const setDraft = useCallback((q: Quote) => draftStore.persist(q), []);
  return { draft, setDraft };
}
