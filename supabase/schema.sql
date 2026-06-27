-- ============================================================================
-- Shift Office — Schéma Supabase (PostgreSQL)
-- ============================================================================
-- À exécuter dans Supabase → SQL Editor, en une fois.
-- Crée les 8 tables, active le RLS et les triggers.
-- Chaque utilisateur ne voit QUE ses propres données (policies auth.uid()).
-- Idempotent : peut être ré-exécuté sans erreur.
-- ============================================================================

-- Fonction utilitaire : met à jour updated_at automatiquement.
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- 1. PROFILES (profil entreprise de l'artisan)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  nom_entreprise text,
  metier text,
  secteur text default 'batiment',
  regime_fiscal text default 'micro',          -- 'micro' | 'societe'
  assujetti_tva boolean default false,
  taux_tva_principal numeric,
  siret text,
  adresse text,
  code_postal text,
  ville text,
  telephone text,
  email_professionnel text,
  logo_url text,
  iban text,
  plan text default 'gratuit',                  -- 'gratuit' | 'essentiel' | 'pro'
  stripe_customer_id text,
  objectifs jsonb default '{"ca_mensuel":0,"devis_mensuel":0,"taux_acceptation":0}',
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;

drop policy if exists "users_own_profile" on public.profiles;
create policy "users_own_profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

-- Crée automatiquement une ligne profiles à chaque inscription.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email_professionnel)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. CLIENTS
-- ----------------------------------------------------------------------------
create table if not exists public.clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  nom text not null,
  email text,
  telephone text,
  adresse text,
  code_postal text,
  ville text,
  siret text,
  type_client text default 'particulier',       -- 'particulier' | 'professionnel'
  notes text,
  created_at timestamptz default now()
);
alter table public.clients enable row level security;

drop policy if exists "users_own_clients" on public.clients;
create policy "users_own_clients" on public.clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists clients_user_id_idx on public.clients(user_id);

-- ----------------------------------------------------------------------------
-- 3. CATALOGUE (bibliothèque produits)
-- ----------------------------------------------------------------------------
create table if not exists public.catalogue (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null default 'materiau',         -- 'materiau' | 'service' | ...
  reference text,
  nom text not null,
  description text,
  prix_unitaire_ht numeric not null default 0,
  prix_achat_ht numeric default 0,
  unite text default 'u',
  taux_tva numeric,
  fournisseur text,
  photo_url text,
  actif boolean default true,
  created_at timestamptz default now()
);
alter table public.catalogue enable row level security;

drop policy if exists "users_own_catalogue" on public.catalogue;
create policy "users_own_catalogue" on public.catalogue
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists catalogue_user_id_idx on public.catalogue(user_id);

-- ----------------------------------------------------------------------------
-- 4. DEVIS
-- ----------------------------------------------------------------------------
create table if not exists public.devis (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  reference text not null,
  statut text default 'brouillon',               -- brouillon | envoye | accepte | refuse
  date_creation date default current_date,
  date_validite date,
  objet text,
  client_nom text,
  client_adresse text,
  client_email text,
  chantier_adresse text,
  lignes jsonb not null default '[]',
  remise numeric default 0,
  sous_total_ht numeric default 0,
  total_tva numeric default 0,
  total_ttc numeric default 0,
  mention_tva text,
  notes text,
  conditions text default '30% à la commande, solde à réception.',
  pdf_url text,
  ia_conversation_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, reference)
);
alter table public.devis enable row level security;

drop policy if exists "users_own_devis" on public.devis;
create policy "users_own_devis" on public.devis
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists devis_updated_at on public.devis;
create trigger devis_updated_at
  before update on public.devis
  for each row execute function public.update_updated_at();

create index if not exists devis_user_id_idx on public.devis(user_id);

-- ----------------------------------------------------------------------------
-- 5. FACTURES
-- ----------------------------------------------------------------------------
create table if not exists public.factures (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  devis_id uuid references public.devis(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  reference text not null,
  type text default 'facture',                   -- 'facture' | 'avoir' | 'acompte'
  statut text default 'emise',                   -- emise | payee | en_retard | annulee
  date_emission date default current_date,
  date_echeance date,
  objet text,
  client_nom text,
  client_adresse text,
  client_email text,
  lignes jsonb not null default '[]',
  remise numeric default 0,
  sous_total_ht numeric default 0,
  total_tva numeric default 0,
  total_ttc numeric default 0,
  montant_paye numeric default 0,
  mention_tva text,
  pdf_url text,
  stripe_payment_link text,
  nb_relances integer default 0,
  derniere_relance_at timestamptz,
  created_at timestamptz default now(),
  unique (user_id, reference)
);
alter table public.factures enable row level security;

drop policy if exists "users_own_factures" on public.factures;
create policy "users_own_factures" on public.factures
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists factures_user_id_idx on public.factures(user_id);

-- ----------------------------------------------------------------------------
-- 6. EMAILS ENVOYÉS (historique)
-- ----------------------------------------------------------------------------
create table if not exists public.emails_envoyes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  destinataire_email text not null,
  destinataire_nom text,
  sujet text not null,
  corps text not null,
  type text not null,                            -- 'devis' | 'facture' | 'relance' | 'email_pro'
  document_id uuid,
  document_type text,
  statut text default 'envoye',
  resend_id text,
  created_at timestamptz default now()
);
alter table public.emails_envoyes enable row level security;

drop policy if exists "users_own_emails" on public.emails_envoyes;
create policy "users_own_emails" on public.emails_envoyes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists emails_user_id_idx on public.emails_envoyes(user_id);

-- ----------------------------------------------------------------------------
-- 7. CONVERSATIONS IA
-- ----------------------------------------------------------------------------
create table if not exists public.conversations_ia (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  devis_id uuid references public.devis(id) on delete set null,
  type text default 'devis',                     -- devis | relance | email_pro | rapport_chantier
  messages jsonb not null default '[]',
  metier_detecte text,
  etape_courante integer default 0,
  reponses_collectees jsonb default '{}',
  complete boolean default false,
  created_at timestamptz default now()
);
alter table public.conversations_ia enable row level security;

drop policy if exists "users_own_conversations" on public.conversations_ia;
create policy "users_own_conversations" on public.conversations_ia
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists conversations_user_id_idx on public.conversations_ia(user_id);

-- ----------------------------------------------------------------------------
-- 8. COFFRE-FORT (documents)
-- ----------------------------------------------------------------------------
create table if not exists public.coffre_fort (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  nom text not null,
  type text not null,
  tags text[] default '{}',
  document_ref_id uuid,
  document_ref_type text,
  fichier_url text,
  taille_ko integer,
  description text,
  date_document date,
  created_at timestamptz default now()
);
alter table public.coffre_fort enable row level security;

drop policy if exists "users_own_coffre" on public.coffre_fort;
create policy "users_own_coffre" on public.coffre_fort
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists coffre_user_id_idx on public.coffre_fort(user_id);

-- ============================================================================
-- Fin du schéma.
-- Étapes suivantes (dashboard Supabase) :
--   Authentication → Providers : activer Email, Magic Link, Google OAuth
--   Authentication → URL Configuration → Redirect URLs :
--     http://localhost:3000/auth/callback  et  https://shiftoffice.fr/auth/callback
-- ============================================================================
