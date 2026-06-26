import {
  LayoutDashboard,
  FolderClosed,
  Sparkles,
  FileText,
  ShieldCheck,
  CreditCard,
  Building2,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

/** Menu principal de l'application (sidebar). */
export const APP_NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Vue d'ensemble",
  },
  {
    label: "Documents",
    href: "/documents",
    icon: FolderClosed,
    description: "Tous vos documents",
  },
  {
    label: "Assistant IA",
    href: "/assistant",
    icon: Sparkles,
    description: "Votre assistant intelligent",
  },
  {
    label: "Devis & Factures",
    href: "/devis-factures",
    icon: FileText,
    description: "Devis et factures",
  },
  {
    label: "Coffre-fort",
    href: "/coffre-fort",
    icon: ShieldCheck,
    description: "Documents sécurisés",
  },
  {
    label: "Abonnement",
    href: "/abonnement",
    icon: CreditCard,
    description: "Votre formule",
  },
  {
    label: "Profil",
    href: "/profil",
    icon: Building2,
    description: "Profil entreprise",
  },
];

/** Lien secondaire (bas de sidebar). */
export const APP_NAV_SECONDARY: NavItem[] = [
  {
    label: "Paramètres",
    href: "/parametres",
    icon: Settings,
  },
];

/** Liens du site vitrine. */
export const MARKETING_NAV = [
  { label: "Fonctionnalités", href: "/#fonctionnalites" },
  { label: "Métiers", href: "/#metiers" },
  { label: "Tarifs", href: "/#tarifs" },
  { label: "FAQ", href: "/#faq" },
];

/** Liens légaux (footer). */
export const LEGAL_NAV = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Confidentialité", href: "/confidentialite" },
  { label: "CGU", href: "/cgu" },
];
