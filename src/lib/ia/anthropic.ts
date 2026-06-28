import Anthropic from "@anthropic-ai/sdk";

/**
 * Client Anthropic pour le « Mode rapide » (extraction de champs depuis une
 * description en langage naturel). Activé seulement si ANTHROPIC_API_KEY est
 * défini. Modèle par défaut : Haiku (rapide et économique pour de
 * l'extraction), surchargeable via AI_MODEL.
 */
let cached: Anthropic | null = null;

export function getAnthropic(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  if (!cached) cached = new Anthropic({ apiKey: key });
  return cached;
}

export function isAIEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export const AI_MODEL = process.env.AI_MODEL || "claude-haiku-4-5-20251001";
