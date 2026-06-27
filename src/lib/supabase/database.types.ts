/**
 * Types des tables Supabase (miroir de supabase/schema.sql).
 * Maintenus à la main pour rester simples ; régénérables plus tard via
 * `supabase gen types typescript` si besoin.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRow = {
  id: string;
  nom_entreprise: string | null;
  metier: string | null;
  secteur: string | null;
  regime_fiscal: string | null;
  assujetti_tva: boolean | null;
  taux_tva_principal: number | null;
  siret: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  telephone: string | null;
  email_professionnel: string | null;
  logo_url: string | null;
  iban: string | null;
  plan: string | null;
  stripe_customer_id: string | null;
  objectifs: Json | null;
  onboarding_complete: boolean | null;
  created_at: string;
  updated_at: string;
};

export type ClientRow = {
  id: string;
  user_id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  siret: string | null;
  type_client: string | null;
  notes: string | null;
  created_at: string;
};

export type CatalogueRow = {
  id: string;
  user_id: string;
  type: string;
  reference: string | null;
  nom: string;
  description: string | null;
  prix_unitaire_ht: number;
  prix_achat_ht: number | null;
  unite: string | null;
  taux_tva: number | null;
  fournisseur: string | null;
  photo_url: string | null;
  actif: boolean | null;
  created_at: string;
};

export type DevisRow = {
  id: string;
  user_id: string;
  client_id: string | null;
  reference: string;
  statut: string | null;
  date_creation: string | null;
  date_validite: string | null;
  objet: string | null;
  client_nom: string | null;
  client_adresse: string | null;
  client_email: string | null;
  chantier_adresse: string | null;
  lignes: Json;
  remise: number | null;
  sous_total_ht: number | null;
  total_tva: number | null;
  total_ttc: number | null;
  mention_tva: string | null;
  notes: string | null;
  conditions: string | null;
  pdf_url: string | null;
  ia_conversation_id: string | null;
  created_at: string;
  updated_at: string;
};

export type FactureRow = {
  id: string;
  user_id: string;
  devis_id: string | null;
  client_id: string | null;
  reference: string;
  type: string | null;
  statut: string | null;
  date_emission: string | null;
  date_echeance: string | null;
  objet: string | null;
  client_nom: string | null;
  client_adresse: string | null;
  client_email: string | null;
  lignes: Json;
  remise: number | null;
  sous_total_ht: number | null;
  total_tva: number | null;
  total_ttc: number | null;
  montant_paye: number | null;
  mention_tva: string | null;
  pdf_url: string | null;
  stripe_payment_link: string | null;
  nb_relances: number | null;
  derniere_relance_at: string | null;
  created_at: string;
};

export type EmailRow = {
  id: string;
  user_id: string;
  destinataire_email: string;
  destinataire_nom: string | null;
  sujet: string;
  corps: string;
  type: string;
  document_id: string | null;
  document_type: string | null;
  statut: string | null;
  resend_id: string | null;
  created_at: string;
};

export type ConversationRow = {
  id: string;
  user_id: string;
  devis_id: string | null;
  type: string | null;
  messages: Json;
  metier_detecte: string | null;
  etape_courante: number | null;
  reponses_collectees: Json | null;
  complete: boolean | null;
  created_at: string;
};

export type CoffreRow = {
  id: string;
  user_id: string;
  nom: string;
  type: string;
  tags: string[] | null;
  document_ref_id: string | null;
  document_ref_type: string | null;
  fichier_url: string | null;
  taille_ko: number | null;
  description: string | null;
  date_document: string | null;
  created_at: string;
};

/** Helper : une table dont Insert/Update dérivent de la Row. */
type TableShape<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableShape<ProfileRow>;
      clients: TableShape<ClientRow>;
      catalogue: TableShape<CatalogueRow>;
      devis: TableShape<DevisRow>;
      factures: TableShape<FactureRow>;
      emails_envoyes: TableShape<EmailRow>;
      conversations_ia: TableShape<ConversationRow>;
      coffre_fort: TableShape<CoffreRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
