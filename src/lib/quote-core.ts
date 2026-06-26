/**
 * Cœur métier des devis/factures — logique PURE (types + calculs).
 * Importable côté serveur (route IA) ET côté client (stockage, UI).
 */

export type LineKind =
  | "material"
  | "labor"
  | "travel"
  | "rental"
  | "service"
  | "other";

export type QuoteLine = {
  id: string;
  kind: LineKind;
  designation: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number; // prix unitaire HT (vente)
  purchasePrice: number; // prix d'achat unitaire (0 si inconnu)
  vat: number; // taux de TVA (20, 10, 5.5)
};

export type DocType = "devis" | "facture";

export type Quote = {
  id: string;
  type: DocType;
  number: string;
  title: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  lines: QuoteLine[];
  discount: number; // remise globale en %
  validityDays: number;
  paymentTerms: string;
  notes: string;
  status: "draft" | "sent" | "accepted" | "paid";
  createdAt: string; // ISO
};

export function emptyQuote(): Quote {
  return {
    id: "",
    type: "devis",
    number: "",
    title: "",
    clientName: "",
    clientAddress: "",
    clientEmail: "",
    lines: [],
    discount: 0,
    validityDays: 30,
    paymentTerms: "Paiement à 30 jours.",
    notes: "",
    status: "draft",
    createdAt: "",
  };
}

export type QuoteTotals = {
  subtotalHT: number;
  discountAmount: number;
  netHT: number;
  vatByRate: { rate: number; base: number; amount: number }[];
  totalTVA: number;
  totalTTC: number;
  materialCost: number;
  laborTotal: number;
  margin: number;
};

export function computeTotals(quote: Quote): QuoteTotals {
  const factor = 1 - (quote.discount || 0) / 100;
  let subtotalHT = 0;
  let materialCost = 0;
  let laborTotal = 0;
  let purchaseTotal = 0;
  const byRate = new Map<number, number>();

  for (const l of quote.lines) {
    const lineHT = (l.qty || 0) * (l.unitPrice || 0);
    subtotalHT += lineHT;
    const netLine = lineHT * factor;
    byRate.set(l.vat, (byRate.get(l.vat) || 0) + netLine);
    purchaseTotal += (l.qty || 0) * (l.purchasePrice || 0);
    if (l.kind === "labor") laborTotal += lineHT;
    if (l.kind === "material")
      materialCost += (l.qty || 0) * (l.purchasePrice || 0);
  }

  const discountAmount = subtotalHT * (1 - factor);
  const netHT = subtotalHT - discountAmount;
  const vatByRate = [...byRate.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([rate, base]) => ({ rate, base, amount: base * (rate / 100) }));
  const totalTVA = vatByRate.reduce((s, v) => s + v.amount, 0);
  const totalTTC = netHT + totalTVA;
  const margin = netHT - purchaseTotal;

  return {
    subtotalHT,
    discountAmount,
    netHT,
    vatByRate,
    totalTVA,
    totalTTC,
    materialCost,
    laborTotal,
    margin,
  };
}

export function formatEUR(n: number): string {
  return (n || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function nextNumber(
  quotes: Quote[],
  type: DocType,
  year: number
): string {
  const prefix = type === "facture" ? "FAC" : "DEV";
  const count = quotes.filter(
    (q) => q.type === type && q.number.includes(`-${year}-`)
  ).length;
  return `${prefix}-${year}-${String(count + 1).padStart(3, "0")}`;
}

export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `q_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6)}`;
}
