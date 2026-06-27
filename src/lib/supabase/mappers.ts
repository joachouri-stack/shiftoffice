/**
 * Mappers : conversion entre les types de l'app (local-first) et les lignes
 * des tables Supabase. Au sprint final, les stores liront/écriront via ces
 * fonctions — aucune logique métier n'est dupliquée.
 *
 * Note : la colonne `vat` (n° TVA intracommunautaire) de CompanyProfile n'a pas
 * d'équivalent dans le schéma ; à ajouter si besoin.
 */

import type { CompanyProfile, FiscalRegime } from "@/lib/companyProfile";
import type { Client, ClientType } from "@/lib/clients";
import type { SentEmail, EmailKind } from "@/lib/emails";
import { computeTotals, type Quote, type QuoteLine } from "@/lib/quote-core";
import type {
  ProfileRow,
  ClientRow,
  DevisRow,
  FactureRow,
  EmailRow,
  Json,
} from "./database.types";

/* ------------------------------- Profil ---------------------------------- */

export function profileFromRow(r: ProfileRow): CompanyProfile {
  return {
    name: r.nom_entreprise ?? "",
    trade: r.metier ?? "",
    email: r.email_professionnel ?? "",
    phone: r.telephone ?? "",
    siret: r.siret ?? "",
    vat: "",
    address: r.adresse ?? "",
    postalCode: r.code_postal ?? "",
    city: r.ville ?? "",
    logo: r.logo_url ?? "",
    fiscalRegime: (r.regime_fiscal as FiscalRegime) ?? "micro",
    vatLiable: r.assujetti_tva ?? false,
    vatRate: r.taux_tva_principal ?? 0,
    plan: (r.plan as CompanyProfile["plan"]) ?? "gratuit",
    onboardingComplete: r.onboarding_complete ?? false,
  };
}

export function profileToRow(p: CompanyProfile): Partial<ProfileRow> {
  return {
    nom_entreprise: p.name,
    metier: p.trade,
    email_professionnel: p.email,
    telephone: p.phone,
    siret: p.siret,
    adresse: p.address,
    code_postal: p.postalCode,
    ville: p.city,
    logo_url: p.logo,
    regime_fiscal: p.fiscalRegime,
    assujetti_tva: p.vatLiable,
    taux_tva_principal: p.vatRate,
    plan: p.plan,
    onboarding_complete: p.onboardingComplete,
  };
}

/* ------------------------------- Client ---------------------------------- */

export function clientFromRow(r: ClientRow): Client {
  return {
    id: r.id,
    name: r.nom,
    type: (r.type_client as ClientType) ?? "particulier",
    email: r.email ?? "",
    phone: r.telephone ?? "",
    address: r.adresse ?? "",
    postalCode: r.code_postal ?? "",
    city: r.ville ?? "",
    siret: r.siret ?? "",
    notes: r.notes ?? "",
  };
}

export function clientToRow(c: Client, userId: string): Partial<ClientRow> {
  return {
    user_id: userId,
    nom: c.name,
    type_client: c.type,
    email: c.email,
    telephone: c.phone,
    adresse: c.address,
    code_postal: c.postalCode,
    ville: c.city,
    siret: c.siret,
    notes: c.notes,
  };
}

/* --------------------------- Devis / Factures ----------------------------- */

// Correspondance des statuts app ↔ BDD (ajustable selon le workflow voulu).
const DEVIS_STATUT: Record<Quote["status"], string> = {
  draft: "brouillon",
  sent: "envoye",
  accepted: "accepte",
  refused: "refuse",
  paid: "accepte",
};
const FACTURE_STATUT: Record<Quote["status"], string> = {
  draft: "emise",
  sent: "emise",
  accepted: "emise",
  refused: "annulee",
  paid: "payee",
};

/** Quote (type "devis") → ligne de la table devis. */
export function devisToRow(q: Quote, userId: string): Partial<DevisRow> {
  const t = computeTotals(q);
  return {
    user_id: userId,
    reference: q.number,
    statut: DEVIS_STATUT[q.status] ?? "brouillon",
    objet: q.title,
    client_nom: q.clientName,
    client_adresse: q.clientAddress,
    client_email: q.clientEmail,
    lignes: q.lines as unknown as Json,
    remise: q.discount,
    sous_total_ht: t.subtotalHT,
    total_tva: t.totalTVA,
    total_ttc: t.totalTTC,
    conditions: q.paymentTerms,
    notes: q.notes,
  };
}

/** Quote (type "facture") → ligne de la table factures. */
export function factureToRow(q: Quote, userId: string): Partial<FactureRow> {
  const t = computeTotals(q);
  return {
    user_id: userId,
    reference: q.number,
    statut: FACTURE_STATUT[q.status] ?? "emise",
    objet: q.title,
    client_nom: q.clientName,
    client_adresse: q.clientAddress,
    client_email: q.clientEmail,
    lignes: q.lines as unknown as Json,
    remise: q.discount,
    sous_total_ht: t.subtotalHT,
    total_tva: t.totalTVA,
    total_ttc: t.totalTTC,
  };
}

function statutToAppStatus(
  statut: string | null,
  fallback: Quote["status"]
): Quote["status"] {
  switch (statut) {
    case "brouillon":
    case "emise":
      return "draft";
    case "envoye":
      return "sent";
    case "accepte":
      return "accepted";
    case "payee":
      return "paid";
    default:
      return fallback;
  }
}

/** Ligne devis BDD → Quote. */
export function devisFromRow(r: DevisRow): Quote {
  return {
    id: r.id,
    type: "devis",
    number: r.reference,
    title: r.objet ?? "",
    clientName: r.client_nom ?? "",
    clientAddress: r.client_adresse ?? "",
    clientEmail: r.client_email ?? "",
    lines: (r.lignes as unknown as QuoteLine[]) ?? [],
    discount: r.remise ?? 0,
    validityDays: 30,
    paymentTerms: r.conditions ?? "",
    notes: r.notes ?? "",
    status: statutToAppStatus(r.statut, "draft"),
    createdAt: r.created_at,
  };
}

/** Ligne facture BDD → Quote. */
export function factureFromRow(r: FactureRow): Quote {
  return {
    id: r.id,
    type: "facture",
    number: r.reference,
    title: r.objet ?? "",
    clientName: r.client_nom ?? "",
    clientAddress: r.client_adresse ?? "",
    clientEmail: r.client_email ?? "",
    lines: (r.lignes as unknown as QuoteLine[]) ?? [],
    discount: r.remise ?? 0,
    validityDays: 30,
    paymentTerms: "",
    notes: "",
    status: statutToAppStatus(r.statut, "sent"),
    createdAt: r.created_at,
  };
}

/* ------------------------------- Emails ---------------------------------- */

export function emailFromRow(r: EmailRow): SentEmail {
  return {
    id: r.id,
    to: r.destinataire_email,
    toName: r.destinataire_nom ?? "",
    subject: r.sujet,
    body: r.corps,
    kind: (r.type as EmailKind) ?? "devis",
    documentId: r.document_id ?? "",
    documentRef: r.document_type ?? "",
    createdAt: r.created_at,
  };
}

export function emailToRow(e: SentEmail, userId: string): Partial<EmailRow> {
  return {
    user_id: userId,
    destinataire_email: e.to,
    destinataire_nom: e.toName,
    sujet: e.subject,
    corps: e.body,
    type: e.kind,
    document_id: e.documentId || null,
    document_type: e.documentRef || null,
    statut: "envoye",
  };
}
