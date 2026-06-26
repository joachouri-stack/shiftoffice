# [ ] Shift Office

**L'IA qui travaille pour votre entreprise.**

SaaS premium destiné aux artisans du bâtiment. Notre mission : faire gagner
plusieurs heures par semaine grâce à l'intelligence artificielle.

> Partie 1 — Vision · Branding · Design System · Architecture V1

---

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS v4** (configuration via `@theme` dans `globals.css`)
- **lucide-react** (icônes)
- Polices : **Inter** (sans) + **Fraunces** (serif) via `next/font`

## Démarrer

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de production
npm run lint     # ESLint
```

## Architecture

```
src/
├─ app/
│  ├─ layout.tsx             # Layout racine : polices, SEO, viewport
│  ├─ globals.css            # Design system (tokens, couleurs, typo)
│  ├─ not-found.tsx          # Page 404
│  ├─ (marketing)/           # Site vitrine (Navbar + Footer)
│  │  ├─ page.tsx            # Accueil
│  │  ├─ mentions-legales/
│  │  ├─ confidentialite/
│  │  └─ cgu/
│  ├─ (auth)/                # Connexion / Inscription
│  └─ (app)/                 # Espace connecté (Sidebar)
│     ├─ dashboard/
│     ├─ documents/
│     ├─ assistant/
│     ├─ devis-factures/
│     ├─ coffre-fort/
│     ├─ abonnement/
│     ├─ profil/
│     └─ parametres/
├─ components/
│  ├─ brand/Logo.tsx         # Logo officiel
│  ├─ ui/                    # Primitives (Button, Card, Input, Badge…)
│  ├─ marketing/             # Sections du site vitrine
│  └─ app/                   # Sidebar, MobileNav, PageHeader…
└─ lib/
   ├─ navigation.ts          # Configuration des menus
   └─ utils.ts               # Helper `cn`
```

## Design System

### Couleurs

| Rôle             | Hex       | Token Tailwind |
| ---------------- | --------- | -------------- |
| Orange principal | `#FF6B2B` | `brand`        |
| Noir             | `#0A0A0F` | `ink`          |
| Blanc            | `#FFFFFF` | `paper`        |
| Gris très clair  | `#F7F7F8` | `mist`         |
| Gris texte       | `#6B7280` | `muted`        |

Le blanc domine, l'orange sert uniquement d'accent.

### Logo

`[ ] Shift Office` — composant `<Logo />` (`src/components/brand/Logo.tsx`).

- Crochets `[ ]` : Inter Light 300, orange
- **Shift** : Inter ExtraBold 800, letter-spacing -0.02em, orange
- _Office_ : Fraunces Medium 500, noir (fond clair) / blanc (fond sombre)

Le logo ne doit jamais être déformé.

## Responsive

Développement **mobile-first**. Validé sur mobile (390px), tablette (768px)
et desktop (1440px) : aucun scroll horizontal, aucun débordement.
