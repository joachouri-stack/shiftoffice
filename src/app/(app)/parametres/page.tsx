import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { PageHeader } from "@/components/app/PageHeader";

export const metadata: Metadata = { title: "Paramètres" };

const NOTIFICATIONS = [
  {
    title: "Notifications par e-mail",
    desc: "Recevez un résumé de votre activité.",
    on: true,
  },
  {
    title: "Rappels de devis",
    desc: "Soyez alerté des devis à relancer.",
    on: true,
  },
  {
    title: "Nouveautés produit",
    desc: "Restez informé des dernières fonctionnalités.",
    on: false,
  },
];

const ACCOUNT = [
  { label: "Changer le mot de passe", href: "/parametres" },
  { label: "Profil entreprise", href: "/profil" },
  { label: "Gérer l'abonnement", href: "/abonnement" },
];

export default function ParametresPage() {
  return (
    <>
      <PageHeader
        title="Paramètres"
        subtitle="Gérez votre compte et vos préférences."
      />

      <div className="space-y-6">
        {/* Notifications */}
        <div>
          <h2 className="text-muted mb-3 px-1 text-sm font-semibold tracking-tight uppercase">
            Notifications
          </h2>
          <Card className="divide-line divide-y">
            {NOTIFICATIONS.map((n) => (
              <div
                key={n.title}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="text-ink text-sm font-medium">{n.title}</p>
                  <p className="text-muted text-xs">{n.desc}</p>
                </div>
                <Toggle defaultChecked={n.on} label={n.title} />
              </div>
            ))}
          </Card>
        </div>

        {/* Compte */}
        <div>
          <h2 className="text-muted mb-3 px-1 text-sm font-semibold tracking-tight uppercase">
            Compte
          </h2>
          <Card className="divide-line divide-y">
            {ACCOUNT.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="hover:bg-mist/50 flex items-center justify-between gap-4 px-5 py-4 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
              >
                <span className="text-ink text-sm font-medium">{a.label}</span>
                <ChevronRight size={18} className="text-muted" />
              </Link>
            ))}
          </Card>
        </div>

        {/* Zone danger */}
        <div>
          <h2 className="text-muted mb-3 px-1 text-sm font-semibold tracking-tight uppercase">
            Session
          </h2>
          <Card className="px-5 py-4">
            <Link
              href="/"
              className="text-sm font-medium text-red-500 hover:text-red-600"
            >
              Se déconnecter
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}
