import type { Metadata } from "next";
import { FileText, Plus, Receipt, FileCheck2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/app/PageHeader";

export const metadata: Metadata = { title: "Devis & Factures" };

const ITEMS = [
  { ref: "DEV-2026-018", client: "M. Dupont", amount: "2 480 €", status: "Envoyé", kind: "Devis" },
  { ref: "FAC-2026-042", client: "Mme Lefèvre", amount: "1 150 €", status: "Payée", kind: "Facture" },
  { ref: "DEV-2026-017", client: "SCI Lilas", amount: "5 900 €", status: "Accepté", kind: "Devis" },
  { ref: "FAC-2026-041", client: "M. Bernard", amount: "780 €", status: "En attente", kind: "Facture" },
];

const STATUS_VARIANT: Record<string, "brand" | "neutral" | "success"> = {
  Payée: "success",
  Accepté: "success",
  Envoyé: "brand",
  "En attente": "neutral",
};

export default function DevisFacturesPage() {
  return (
    <>
      <PageHeader
        title="Devis & Factures"
        subtitle="Créez des documents professionnels en quelques secondes."
        action={
          <Button size="sm">
            <Plus size={16} />
            Créer
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card interactive className="flex items-center gap-4 p-5">
          <div className="bg-brand-50 text-brand inline-flex h-12 w-12 items-center justify-center rounded-2xl">
            <FileCheck2 size={22} />
          </div>
          <div>
            <p className="text-ink font-semibold">Nouveau devis</p>
            <p className="text-muted text-sm">Propre, clair, prêt à envoyer.</p>
          </div>
        </Card>
        <Card interactive className="flex items-center gap-4 p-5">
          <div className="bg-brand-50 text-brand inline-flex h-12 w-12 items-center justify-center rounded-2xl">
            <Receipt size={22} />
          </div>
          <div>
            <p className="text-ink font-semibold">Nouvelle facture</p>
            <p className="text-muted text-sm">Transformez un devis en un clic.</p>
          </div>
        </Card>
      </div>

      <Card className="divide-line divide-y">
        {ITEMS.map((item) => (
          <div
            key={item.ref}
            className="hover:bg-mist/50 flex items-center justify-between gap-3 px-5 py-4 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="bg-mist text-muted inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-ink truncate text-sm font-medium">
                  {item.ref} · {item.client}
                </p>
                <p className="text-muted text-xs">{item.kind}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-ink text-sm font-semibold tabular">
                {item.amount}
              </span>
              <Badge variant={STATUS_VARIANT[item.status] ?? "neutral"}>
                {item.status}
              </Badge>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
