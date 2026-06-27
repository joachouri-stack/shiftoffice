"use client";

import {
  MessageCircle,
  HardDrive,
  CalendarDays,
  Mail,
  CreditCard,
  Send,
  Plug,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/app/PageHeader";

type IntegStatus = "soon" | "key-required";

type Integration = {
  icon: LucideIcon;
  name: string;
  desc: string;
  status: IntegStatus;
  requires: string;
};

type Group = { title: string; items: Integration[] };

const GROUPS: Group[] = [
  {
    title: "Envoi & communication",
    items: [
      {
        icon: MessageCircle,
        name: "WhatsApp Business",
        desc: "Envoyez vos devis et factures directement par WhatsApp à vos clients.",
        status: "key-required",
        requires: "Compte Meta Business vérifié + token WhatsApp Cloud API",
      },
      {
        icon: Mail,
        name: "Outlook / Microsoft 365",
        desc: "Envoyez vos documents depuis votre propre adresse Outlook.",
        status: "soon",
        requires: "Connexion Microsoft (OAuth Mail.Send)",
      },
      {
        icon: Send,
        name: "Resend",
        desc: "Envoi des emails (devis, factures, relances) depuis Shift Office.",
        status: "key-required",
        requires: "Clé API Resend + domaine d'envoi vérifié",
      },
    ],
  },
  {
    title: "Stockage & agenda",
    items: [
      {
        icon: HardDrive,
        name: "Google Drive",
        desc: "Sauvegarde automatique de tous vos PDF (devis, factures, contrats).",
        status: "soon",
        requires: "Connexion Google (OAuth drive.file)",
      },
      {
        icon: CalendarDays,
        name: "Google Agenda",
        desc: "Crée un événement pour chaque chantier planifié depuis un devis.",
        status: "soon",
        requires: "Connexion Google (OAuth calendar)",
      },
    ],
  },
  {
    title: "Paiement",
    items: [
      {
        icon: CreditCard,
        name: "Stripe",
        desc: "Abonnements payants et liens de paiement sur vos factures.",
        status: "key-required",
        requires: "Clés Stripe + webhook (backend déployé)",
      },
    ],
  },
];

const STATUS_META: Record<
  IntegStatus,
  { label: string; variant: "neutral" | "warning" }
> = {
  soon: { label: "Bientôt", variant: "neutral" },
  "key-required": { label: "À configurer", variant: "warning" },
};

export default function IntegrationsPage() {
  return (
    <>
      <PageHeader
        title="Intégrations"
        subtitle="Connectez Shift Office à vos outils du quotidien."
      />

      <Card className="bg-ink relative mb-6 overflow-hidden p-5 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(45% 90% at 0% 0%, rgba(255,107,43,0.25) 0%, transparent 70%)",
          }}
        />
        <div className="relative flex items-center gap-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-paper">
            <Plug size={24} />
          </span>
          <div>
            <p className="text-paper font-semibold">
              Bientôt connecté à tout votre écosystème
            </p>
            <p className="mt-0.5 text-sm text-white/70">
              Ces intégrations nécessitent vos comptes et clés. Activez-les en un
              clic dès qu&apos;elles sont prêtes.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-8">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="text-muted mb-3 px-1 text-xs font-semibold uppercase tracking-tight">
              {group.title}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.items.map((it) => {
                const meta = STATUS_META[it.status];
                return (
                  <Card key={it.name} className="flex flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="bg-brand-50 text-brand inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                        <it.icon size={20} />
                      </span>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>
                    <h3 className="text-ink mt-4 font-semibold tracking-tight">
                      {it.name}
                    </h3>
                    <p className="text-muted mt-1 text-sm leading-relaxed">
                      {it.desc}
                    </p>
                    <p className="text-muted/80 mt-3 text-xs">
                      Nécessite : {it.requires}
                    </p>
                    <div className="mt-4">
                      <Button variant="outline" size="sm" disabled className="w-full">
                        Connecter
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
