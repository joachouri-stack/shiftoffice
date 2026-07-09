"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Brouillon automatique des parcours de génération : la saisie survit à un
 * rechargement de page (fermeture d'onglet, retour depuis Stripe…).
 * Conservé 24 h, purgé à la génération du document.
 */

const PREFIX = "so.draft.";
const TTL_MS = 24 * 3600 * 1000;

export function loadDraft<T>(key: string, ctx = ""): T | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { t, c, d } = JSON.parse(raw) as { t?: number; c?: string; d?: T };
    if (!t || Date.now() - t > TTL_MS) {
      window.localStorage.removeItem(PREFIX + key);
      return null;
    }
    // Le brouillon appartient à un autre contexte (autre salarié) : on
    // l'ignore pour ne jamais mélanger les données de deux personnes.
    if ((c ?? "") !== ctx) return null;
    return d ?? null;
  } catch {
    return null;
  }
}

export function saveDraft(key: string, d: unknown, ctx = ""): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify({ t: Date.now(), c: ctx, d }));
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
 * Contexte du brouillon : l'identifiant du salarié (ou bien) passé dans
 * l'URL. Deux contextes différents = deux brouillons étanches — le brouillon
 * du salarié A ne se restaure jamais sur le parcours du salarié B.
 */
export function useDraftCtx(param = "s"): string {
  const [ctx] = useState(() =>
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.search).get(param) ?? ""
  );
  return ctx;
}

/**
 * Branche le brouillon sur les champs d'un parcours :
 * restaure une fois quand `ready` passe à true (le brouillon gagne sur le
 * pré-remplissage), puis sauvegarde à chaque changement tant que le
 * document n'est pas généré (`done`).
 *
 * Ne pas y mettre les champs issus de la fiche du salarié (salaire, dates
 * d'embauche…) : ils sont préremplis par le salarié courant et ne doivent
 * pas voyager d'un salarié à l'autre via le brouillon.
 *
 * Usage : useDraft("lettre-licenciement", ready, done, { motifs: [motifs, setMotifs], … }, ctx)
 */
export function useDraft(
  key: string,
  ready: boolean,
  done: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: Record<string, [unknown, (v: any) => void]>,
  ctx = ""
): void {
  const restored = useRef(false);
  // Une case de stockage PAR contexte : le brouillon du salarié A et celui
  // du salarié B coexistent sans jamais s'écraser ni se mélanger.
  const slot = ctx ? `${key}:${ctx}` : key;

  useEffect(() => {
    if (!ready || restored.current) return;
    restored.current = true;
    const d = loadDraft<Record<string, unknown>>(slot, ctx);
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
      clearDraft(slot);
      return;
    }
    saveDraft(slot, JSON.parse(json), ctx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [json, ready, done]);
}
