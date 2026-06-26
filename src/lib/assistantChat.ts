"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ChatMessage } from "./assistant";

const KEY = "shiftoffice.assistant";
const EVENT = "shiftoffice:assistant";
const EMPTY: ChatMessage[] = [];

let cache: ChatMessage[] | null = null;

function load(): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getSnapshot(): ChatMessage[] {
  if (cache === null) cache = load();
  return cache;
}
function getServerSnapshot(): ChatMessage[] {
  return EMPTY;
}
function subscribe(cb: () => void) {
  const h = () => {
    cache = load();
    cb();
  };
  window.addEventListener(EVENT, h);
  window.addEventListener("storage", h);
  return () => {
    window.removeEventListener(EVENT, h);
    window.removeEventListener("storage", h);
  };
}
function persist(msgs: ChatMessage[]) {
  cache = msgs;
  try {
    // garde les 60 derniers messages pour ne pas saturer le stockage
    window.localStorage.setItem(KEY, JSON.stringify(msgs.slice(-60)));
  } catch {
    /* quota */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Conversation de l'assistant, persistée entre les visites. */
export function useAssistantChat() {
  const messages = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const commit = useCallback((msgs: ChatMessage[]) => persist(msgs), []);
  const clear = useCallback(() => persist([]), []);
  return { messages, commit, clear };
}
