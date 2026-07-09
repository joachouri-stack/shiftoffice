-- ============================================================
-- Shift Office — Schéma Supabase
-- À exécuter dans Supabase : SQL Editor > New query > Run.
-- Tables : profiles (infos entreprise), salaries, documents_historique.
-- Sécurité : Row Level Security — chaque utilisateur ne voit que ses données.
-- ============================================================

-- ---------- profiles (1 ligne par utilisateur) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  entreprise_nom text,
  entreprise_adresse text,
  siret text,
  representant_nom text,
  representant_qualite text,
  ville text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- entreprises (plusieurs par utilisateur) ----------
create table if not exists public.entreprises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nom text not null,
  adresse text,
  siret text,
  representant_nom text,
  representant_qualite text,
  ville text,
  created_at timestamptz not null default now()
);
create index if not exists entreprises_user_idx on public.entreprises (user_id);

-- ---------- salaries ----------
create table if not exists public.salaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nom text not null,
  poste text,
  numero_secu text,
  salaire_brut numeric,
  date_embauche text,
  created_at timestamptz not null default now()
);
create index if not exists salaries_user_idx on public.salaries (user_id);

-- ---------- espaces (synchronisation de l'espace local) ----------
-- Une ligne par utilisateur : tout l'espace (entreprises, salariés, fiches,
-- biens, historique local) dans une colonne JSONB — c'est la table utilisée
-- par la synchronisation multi-appareils du site.
create table if not exists public.espaces (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- documents_historique (suivi, sans contenu) ----------
create table if not exists public.documents_historique (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  titre text,
  prix numeric,
  created_at timestamptz not null default now()
);
create index if not exists historique_user_idx on public.documents_historique (user_id, created_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.entreprises enable row level security;
alter table public.salaries enable row level security;
alter table public.documents_historique enable row level security;
alter table public.espaces enable row level security;

drop policy if exists "espaces_self" on public.espaces;
create policy "espaces_self" on public.espaces
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "entreprises_self" on public.entreprises;
create policy "entreprises_self" on public.entreprises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "salaries_self" on public.salaries;
create policy "salaries_self" on public.salaries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "historique_self" on public.documents_historique;
create policy "historique_self" on public.documents_historique
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Création automatique du profil à l'inscription
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
