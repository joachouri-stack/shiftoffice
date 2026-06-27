/**
 * Statuts des devis / factures : libellés, tons (Badge) et options par type.
 * Module PUR — importable partout.
 */

import type { DocType, Quote } from "./quote-core";

export type DocStatus = Quote["status"];

type Tone = "neutral" | "brand" | "success" | "warning" | "danger";

export type StatusMeta = { label: string; variant: Tone };

const DEVIS_META: Record<DocStatus, StatusMeta> = {
  draft: { label: "Brouillon", variant: "neutral" },
  sent: { label: "Envoyé", variant: "brand" },
  accepted: { label: "Accepté", variant: "success" },
  refused: { label: "Refusé", variant: "danger" },
  paid: { label: "Payé", variant: "success" },
};

const FACTURE_META: Record<DocStatus, StatusMeta> = {
  draft: { label: "Brouillon", variant: "neutral" },
  sent: { label: "En attente", variant: "warning" },
  accepted: { label: "En attente", variant: "warning" },
  refused: { label: "Annulée", variant: "danger" },
  paid: { label: "Payée", variant: "success" },
};

/** Statuts proposés à la sélection selon le type de document. */
export const STATUS_OPTIONS: Record<DocType, DocStatus[]> = {
  devis: ["draft", "sent", "accepted", "refused"],
  facture: ["draft", "sent", "paid", "refused"],
};

export function statusMeta(status: DocStatus, type: DocType): StatusMeta {
  return (type === "facture" ? FACTURE_META : DEVIS_META)[status];
}
