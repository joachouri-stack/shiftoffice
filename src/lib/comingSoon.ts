"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Inscription « prévenez-moi » pour une fonctionnalité à venir (plan Business). */
export type ComingSoonSignup = {
  id: string;
  email: string;
  feature: string;
  createdAt: string;
};

const STORAGE_KEY = "shiftoffice.comingsoon";
const EVENT = "shiftoffice:comingsoon";

let cache: ComingSoonSignup[] | null = null;

function load(): ComingSoonSignup[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ComingSoonSignup[]) : [];
  } catch {
    return [];
  }
}

function getSnapshot(): ComingSoonSignup[] {
  if (cache === null) cache = load();
  return cache;
}

const EMPTY: ComingSoonSignup[] = [];
function getServerSnapshot(): ComingSoonSignup[] {
  return EMPTY;
}

function subscribe(cb: () => void): () => void {
  const handler = () => {
    cache = load();
    cb();
  };
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function persist(list: ComingSoonSignup[]) {
  cache = list;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota — ignoré */
  }
  window.dispatchEvent(new Event(EVENT));
}

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `cs_${Date.now().toString(36)}`;
}

/**
 * Enregistre une demande de notification. Local-first + envoi best-effort à
 * l'API (qui persistera en base une fois Supabase branché).
 */
export function useComingSoon() {
  const signups = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const record = useCallback((email: string, feature: string) => {
    persist([
      { id: newId(), email, feature, createdAt: new Date().toISOString() },
      ...getSnapshot(),
    ]);
    // Best-effort : sera persisté côté serveur quand la base sera active.
    void fetch("/api/notifications/coming-soon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, feature_name: feature }),
    }).catch(() => {});
  }, []);

  return { signups, record };
}
