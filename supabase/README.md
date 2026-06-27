# Terrain Supabase — guide de branchement

Tout le code nécessaire est déjà en place. L'app tourne en **local-first** tant
que les clés ne sont pas renseignées (`isSupabaseConfigured()` renvoie `false`).
Voici les étapes pour activer Supabase au sprint final.

## 1. Créer le projet

1. Aller sur https://supabase.com → **New project**.
2. Noter le mot de passe de la base.
3. **Project Settings → API** : récupérer
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (serveur uniquement)

## 2. Créer les tables

**SQL Editor → New query** → coller le contenu de [`schema.sql`](./schema.sql)
→ **Run**. Crée les 8 tables, le RLS et les triggers (idempotent).

## 3. Activer l'authentification

**Authentication → Providers** :
- **Email** (mot de passe) : activé
- **Email → Magic Link** : activé
- **Google** : activer, renseigner Client ID + Secret
  (Google Cloud Console → OAuth 2.0)

**Authentication → URL Configuration → Redirect URLs** :
```
http://localhost:3000/auth/callback
https://shiftoffice.fr/auth/callback
```

## 4. Renseigner les variables

Copier `.env.example` → `.env.local` (dev) ou configurer sur Coolify (prod),
et remplir les valeurs Supabase. Au prochain démarrage, `isSupabaseConfigured()`
passe à `true`.

## 5. Brancher le code (déjà préparé)

| Élément | Fichier prêt |
| --- | --- |
| Client navigateur | `src/lib/supabase/client.ts` → `getSupabaseBrowser()` |
| Client serveur | `src/lib/supabase/server.ts` → `getSupabaseServer()` |
| Connexion (Google / Magic Link / mdp) | `src/lib/supabase/auth.ts` |
| Conversion types app ↔ BDD | `src/lib/supabase/mappers.ts` |
| Types des tables | `src/lib/supabase/database.types.ts` |

Reste à faire au sprint final (ordre conseillé) :

1. **Page `/auth/callback`** — échange le code OAuth contre une session
   (`supabase.auth.exchangeCodeForSession`).
2. **Middleware** (`middleware.ts`) — rafraîchit la session et protège `(app)`.
3. **Brancher les pages Connexion / Inscription** sur `auth.ts`.
4. **Basculer les stores** local-first vers Supabase, via les mappers :
   `companyProfile` → `profiles`, `clients` → `clients`,
   `quotes` → `devis` / `factures`, `emails` → `emails_envoyes`,
   `products` → `catalogue`.
   Garder un fallback local-first si `isSupabaseConfigured()` est `false`.

## Correspondance stores ↔ tables

| Store local-first | Table Supabase | Mapper |
| --- | --- | --- |
| `shiftoffice.company` | `profiles` | `profileFromRow` / `profileToRow` |
| `shiftoffice.clients` | `clients` | `clientFromRow` / `clientToRow` |
| `shiftoffice.quotes` (devis) | `devis` | `devisFromRow` / `devisToRow` |
| `shiftoffice.quotes` (facture) | `factures` | `factureFromRow` / `factureToRow` |
| `shiftoffice.emails` | `emails_envoyes` | `emailFromRow` / `emailToRow` |
| `shiftoffice.products` | `catalogue` | _(à ajouter)_ |
