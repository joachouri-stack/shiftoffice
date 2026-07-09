"use client";

import { useEffect, useRef } from "react";

/**
 * Brouillon automatique des parcours de génération : la saisie survit à un
 * rechargement de page (fermeture d'onglet, retour depuis Stripe…).
 * Conservé 24 h, purgé à la génération du document.
 */

const PREFIX = "so.draft.";
const TTL_MS = 24 * 3600 * 1000;

export function loadDraft<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { t, d } = JSON.parse(raw) as { t?: number; d?: T };
    if (!t || Date.now() - t > TTL_MS) {
      window.localStorage.removeItem(PREFIX + key);
      return null;
    }
    return d ?? null;
  } catch {
    return null;
  }
}

export function saveDraft(key: string, d: unknown): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify({ t: Date.now(), d }));
  } catch {
    /* stockage plein ou indisponible : best-effort */
  }
}

export function clearDraft(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

/**
 * Branche le brouillon sur les champs d'un parcours :
 * restaure une fois quand `ready` passe à true (le brouillon gagne sur le
 * pré-remplissage), puis sauvegarde à chaque changement tant que le
 * document n'est pas généré (`done`).
 *
 * Usage : useDraft("lettre-licenciement", ready, done, { motifs: [motifs, setMotifs], … })
 */
export function useDraft(
  key: string,
  ready: boolean,
  done: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: Record<string, [unknown, (v: any) => void]>
): void {
  const restored = useRef(false);

  useEffect(() => {
    if (!ready || restored.current) return;
    restored.current = true;
    const d = loadDraft<Record<string, unknown>>(key);
    if (!d) return;
    for (const [k, [, set]] of Object.entries(fields)) {
      if (d[k] !== undefined) set(d[k] as never);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const json = JSON.stringify(
    Object.fromEntries(Object.entries(fields).map(([k, [v]]) => [k, v]))
  );
  useEffect(() => {
    if (!ready || !restored.current) return;
    if (done) {
      clearDraft(key);
      return;
    }
    saveDraft(key, JSON.parse(json));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [json, ready, done]);
}
