"use client";

import { useCallback, useSyncExternalStore } from "react";

export type EmailKind = "devis" | "facture" | "relance" | "email_pro";

/** Un email préparé/envoyé depuis Shift Office (historique). */
export type SentEmail = {
  id: string;
  to: string;
  toName: string;
  subject: string;
  body: string;
  kind: EmailKind;
  documentId: string;
  documentRef: string;
  createdAt: string; // ISO
};

const STORAGE_KEY = "shiftoffice.emails";
const EVENT = "shiftoffice:emails";

let cache: SentEmail[] | null = null;

function load(): SentEmail[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SentEmail[]) : [];
  } catch {
    return [];
  }
}

function getSnapshot(): SentEmail[] {
  if (cache === null) cache = load();
  return cache;
}

const EMPTY: SentEmail[] = [];
function getServerSnapshot(): SentEmail[] {
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

function persist(emails: SentEmail[]) {
  cache = emails;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(emails));
  } catch {
    // quota dépassé — ignoré
  }
  window.dispatchEvent(new Event(EVENT));
}

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `e_${Date.now().toString(36)}`;
}

/**
 * Hook React : historique des emails préparés/envoyés.
 * Local-first, prêt à basculer vers la table emails_envoyes (Supabase) +
 * envoi réel via Resend au sprint final.
 */
export function useEmails() {
  const emails = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const record = useCallback((e: Omit<SentEmail, "id" | "createdAt">) => {
    persist([
      { ...e, id: newId(), createdAt: new Date().toISOString() },
      ...getSnapshot(),
    ]);
  }, []);

  return { emails, record };
}
