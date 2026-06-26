import type { Metadata } from "next";
import { Search, Plus, FileText, Filter } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/app/PageHeader";

export const metadata: Metadata = { title: "Documents" };

const DOCS = [
  { name: "Devis — Salle de bain Dupont", type: "Devis", date: "26 juin 2026" },
  { name: "Facture — Chantier Lefèvre", type: "Facture", date: "24 juin 2026" },
  { name: "Photo chantier — Rue des Lilas", type: "Photo", date: "23 juin 2026" },
  { name: "Devis — Rénovation cuisine", type: "Devis", date: "22 juin 2026" },
  { name: "Attestation TVA réduite", type: "PDF", date: "20 juin 2026" },
];

export default function DocumentsPage() {
  return (
    <>
      <PageHeader
        title="Documents"
        subtitle="Tous vos fichiers, centralisés et faciles à retrouver."
        action={
          <Button size="sm">
            <Plus size={16} />
            Ajouter
          </Button>
        }
      />

      {/* Barre de recherche + filtre */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="border-line bg-paper focus-within:border-brand focus-within:ring-brand/10 flex h-11 flex-1 items-center gap-2.5 rounded-xl border px-3.5 transition-all focus-within:ring-4">
          <Search size={18} className="text-muted shrink-0" />
          <input
            placeholder="Rechercher un document…"
            className="text-ink placeholder:text-muted/70 w-full bg-transparent text-[0.95rem] outline-none"
          />
        </div>
        <Button variant="outline" size="md" className="sm:w-auto">
          <Filter size={16} />
          Filtrer
        </Button>
      </div>

      <Card className="divide-line divide-y">
        {DOCS.map((doc) => (
          <div
            key={doc.name}
            className="hover:bg-mist/50 flex items-center justify-between gap-3 px-5 py-4 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="bg-mist text-muted inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-ink truncate text-sm font-medium">
                  {doc.name}
                </p>
                <p className="text-muted text-xs">{doc.date}</p>
              </div>
            </div>
            <Badge variant="outline" className="shrink-0">
              {doc.type}
            </Badge>
          </div>
        ))}
      </Card>
    </>
  );
}
