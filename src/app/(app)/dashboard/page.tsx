import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  FileText,
  FolderClosed,
  Clock,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/app/PageHeader";

export const metadata: Metadata = { title: "Dashboard" };

const STATS = [
  { label: "Temps gagné ce mois", value: "9 h", icon: Clock, trend: "+12 %" },
  { label: "Documents", value: "24", icon: FolderClosed, trend: "+3" },
  { label: "Devis en cours", value: "5", icon: FileText, trend: "2 à relancer" },
];

const RECENT = [
  { name: "Devis — Salle de bain Dupont", date: "Aujourd'hui", tag: "Devis" },
  { name: "Facture — Chantier Lefèvre", date: "Hier", tag: "Facture" },
  { name: "Photo chantier — Rue des Lilas", date: "Il y a 2 j", tag: "Document" },
  { name: "Devis — Rénovation cuisine", date: "Il y a 3 j", tag: "Devis" },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Bonjour 👋"
        subtitle="Voici un aperçu de votre activité."
        action={
          <Button href="/devis-factures" size="sm">
            <Plus size={16} />
            Nouveau document
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {STATS.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between">
              <div className="bg-mist text-ink inline-flex h-10 w-10 items-center justify-center rounded-xl">
                <s.icon size={18} />
              </div>
              <Badge variant="neutral">{s.trend}</Badge>
            </div>
            <p className="text-ink mt-4 text-3xl font-semibold tracking-tight tabular">
              {s.value}
            </p>
            <p className="text-muted mt-1 text-sm">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Assistant highlight */}
      <Card className="bg-ink relative mt-4 overflow-hidden p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(40% 80% at 100% 0%, rgba(255,107,43,0.3) 0%, transparent 70%)",
          }}
        />
        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="bg-brand text-paper inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-paper text-lg font-semibold">
                Votre assistant IA est prêt
              </h2>
              <p className="mt-1 max-w-md text-sm text-white/70">
                Rédigez un devis, organisez vos documents ou posez une question.
                Gagnez du temps dès maintenant.
              </p>
            </div>
          </div>
          <Button href="/assistant" variant="primary" className="shrink-0">
            Ouvrir l&apos;assistant
            <ArrowUpRight size={17} />
          </Button>
        </div>
      </Card>

      {/* Activité récente */}
      <div className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-ink text-lg font-semibold tracking-tight">
            Activité récente
          </h2>
          <Link
            href="/documents"
            className="text-brand hover:text-brand-600 text-sm font-medium"
          >
            Tout voir
          </Link>
        </div>
        <Card className="divide-line divide-y">
          {RECENT.map((item) => (
            <div
              key={item.name}
              className="hover:bg-mist/50 flex items-center justify-between gap-3 px-5 py-4 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="bg-mist text-muted inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <FileText size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-ink truncate text-sm font-medium">
                    {item.name}
                  </p>
                  <p className="text-muted text-xs">{item.date}</p>
                </div>
              </div>
              <Badge variant="outline" className="shrink-0">
                {item.tag}
              </Badge>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
