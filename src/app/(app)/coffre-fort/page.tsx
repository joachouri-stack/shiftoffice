import type { Metadata } from "next";
import { ShieldCheck, Lock, Upload, FileKey2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/app/PageHeader";

export const metadata: Metadata = { title: "Coffre-fort" };

const SECURED = [
  { name: "Assurance décennale", date: "Ajouté le 12 juin 2026" },
  { name: "Kbis entreprise", date: "Ajouté le 5 juin 2026" },
  { name: "Attestation URSSAF", date: "Ajouté le 1 juin 2026" },
];

export default function CoffreFortPage() {
  return (
    <>
      <PageHeader
        title="Coffre-fort"
        subtitle="Vos documents importants, chiffrés et à l'abri."
        action={
          <Button size="sm">
            <Upload size={16} />
            Déposer
          </Button>
        }
      />

      <Card className="bg-ink relative mb-6 overflow-hidden p-6 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(40% 90% at 0% 0%, rgba(255,107,43,0.25) 0%, transparent 70%)",
          }}
        />
        <div className="relative flex items-center gap-4">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-paper">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-paper font-semibold">
              Vos documents sont protégés
            </p>
            <p className="mt-0.5 text-sm text-white/70">
              Chiffrement de bout en bout. Vous seul y avez accès.
            </p>
          </div>
        </div>
      </Card>

      <Card className="divide-line divide-y">
        {SECURED.map((doc) => (
          <div
            key={doc.name}
            className="hover:bg-mist/50 flex items-center justify-between gap-3 px-5 py-4 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="bg-brand-50 text-brand inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                <FileKey2 size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-ink truncate text-sm font-medium">
                  {doc.name}
                </p>
                <p className="text-muted text-xs">{doc.date}</p>
              </div>
            </div>
            <Badge variant="neutral" className="shrink-0">
              <Lock size={11} />
              Sécurisé
            </Badge>
          </div>
        ))}
      </Card>
    </>
  );
}
