import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/app/PageHeader";

export const metadata: Metadata = { title: "Profil entreprise" };

export default function ProfilPage() {
  return (
    <>
      <PageHeader
        title="Profil entreprise"
        subtitle="Ces informations apparaissent sur vos devis et factures."
      />

      <Card className="p-6 sm:p-8">
        <div className="mb-8 flex items-center gap-4">
          <div className="bg-brand-50 text-brand inline-flex h-16 w-16 items-center justify-center rounded-2xl">
            <Building2 size={28} />
          </div>
          <div>
            <p className="text-ink font-semibold">Votre entreprise</p>
            <p className="text-muted text-sm">Artisan du bâtiment</p>
          </div>
        </div>

        <form className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Nom de l'entreprise" defaultValue="Plomberie Martin" />
            <Input label="Métier" defaultValue="Plombier" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="SIRET" placeholder="123 456 789 00012" />
            <Input
              label="Téléphone"
              type="tel"
              placeholder="06 12 34 56 78"
            />
          </div>
          <Input
            label="Adresse e-mail"
            type="email"
            defaultValue="contact@plomberie-martin.fr"
          />
          <Input label="Adresse" placeholder="12 rue des Artisans, 75000 Paris" />

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" type="button">
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
