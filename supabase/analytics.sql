-- ============================================================
-- Shift Office — Statistiques anonymes (tableau de bord /admin)
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run.
--
-- Crée :
--  - la table `events` : événements anonymes (pages vues, paiements…)
--    → AUCUNE donnée personnelle : pas d'email, pas d'IP, pas de cookie.
--  - les règles de sécurité : tout le monde peut écrire un événement,
--    seul l'admin (jo.achouri@gmail.com connecté) peut les lire.
--  - la fonction `admin_stats` : agrège tout pour la page /admin.
-- ============================================================

create table if not exists public.events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session_id text,          -- identifiant aléatoire de session (anonyme)
  event text not null,      -- pageview | checkout | paiement | gratuit
  path text,                -- page vue (ex. /fiche-de-paie)
  doc text,                 -- slug du document concerné
  source text,              -- provenance (utm_source ou site référent)
  montant numeric,          -- montant en euros (événements paiement)
  ref text                  -- référence Stripe (déduplication)
);

create index if not exists events_created_idx on public.events (created_at desc);
create index if not exists events_event_idx on public.events (event, created_at desc);

alter table public.events enable row level security;

-- Écriture : ouverte (les événements sont anonymes et validés côté serveur).
drop policy if exists "events_insert_public" on public.events;
create policy "events_insert_public" on public.events
  for insert to anon, authenticated
  with check (true);

-- Lecture : réservée au(x) compte(s) admin connecté(s).
-- Pour ajouter un admin : ajoutez son email au tableau ci-dessous ET à la
-- variable d'environnement EMAILS_ADMIN sur Coolify.
drop policy if exists "events_select_admin" on public.events;
create policy "events_select_admin" on public.events
  for select to authenticated
  using ((auth.jwt() ->> 'email') = any (array['jo.achouri@gmail.com']));

-- Ni modification ni suppression via l'API (aucune policy update/delete).

-- ============================================================
-- admin_stats(p_jours) → tout le tableau de bord en un appel.
-- Sécurité : la fonction s'exécute avec les droits de l'appelant
-- (security invoker) — la policy de lecture ci-dessus s'applique,
-- un non-admin n'obtient que des zéros.
-- ============================================================
create or replace function public.admin_stats(p_jours int default 30)
returns jsonb
language sql
stable
as $$
with e as (
  select * from public.events
  where created_at >= now() - make_interval(days => greatest(p_jours, 1))
),
pv as (select * from e where event = 'pageview'),
grat as (select * from e where event = 'gratuit'),
chk as (
  select distinct on (coalesce(ref, id::text)) *
  from e where event = 'checkout'
  order by coalesce(ref, id::text), created_at
),
pay as (
  select distinct on (coalesce(ref, id::text)) *
  from e where event = 'paiement'
  order by coalesce(ref, id::text), created_at
)
select jsonb_build_object(
  'visiteurs',  (select count(distinct session_id) from pv),
  'pages_vues', (select count(*) from pv),
  'gratuits',   (select count(*) from grat),
  'checkouts',  (select count(*) from chk),
  'paiements',  (select count(*) from pay),
  'ca',         (select coalesce(sum(montant), 0) from pay),
  'par_jour', (
    select coalesce(
      jsonb_agg(jsonb_build_object('jour', jour, 'pages', pages, 'visiteurs', visiteurs) order by jour),
      '[]'::jsonb)
    from (
      select date(created_at) as jour, count(*) as pages, count(distinct session_id) as visiteurs
      from pv group by 1
    ) t
  ),
  'top_pages', (
    select coalesce(jsonb_agg(jsonb_build_object('path', path, 'n', n) order by n desc), '[]'::jsonb)
    from (
      select path, count(*) as n from pv
      where path is not null group by 1 order by 2 desc limit 12
    ) t
  ),
  'sources', (
    select coalesce(jsonb_agg(jsonb_build_object('source', source, 'n', n) order by n desc), '[]'::jsonb)
    from (
      select coalesce(nullif(source, ''), 'direct') as source,
             count(distinct session_id) as n
      from pv group by 1 order by 2 desc limit 12
    ) t
  ),
  'docs', (
    select coalesce(
      jsonb_agg(jsonb_build_object(
        'doc', doc, 'visites', visites, 'gratuits', gratuits,
        'checkouts', checkouts, 'paiements', paiements, 'ca', ca
      ) order by paiements desc, checkouts desc, visites desc),
      '[]'::jsonb)
    from (
      select doc,
        count(*) filter (where kind = 'pv')            as visites,
        count(*) filter (where kind = 'gratuit')       as gratuits,
        count(*) filter (where kind = 'chk')           as checkouts,
        count(*) filter (where kind = 'pay')           as paiements,
        coalesce(sum(montant) filter (where kind = 'pay'), 0) as ca
      from (
        select doc, 'pv' as kind, null::numeric as montant from pv where doc is not null
        union all select doc, 'gratuit', null from grat where doc is not null
        union all select doc, 'chk', null from chk where doc is not null
        union all select doc, 'pay', montant from pay where doc is not null
      ) u
      group by doc
    ) t
  )
)
$$;
