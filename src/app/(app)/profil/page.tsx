"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Building2, Upload, Check, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/app/PageHeader";
import { useToast } from "@/components/ui/Toast";
import {
  useCompanyProfile,
  type CompanyProfile,
} from "@/lib/companyProfile";

export default function ProfilPage() {
  const { profile, save } = useCompanyProfile();
  const toast = useToast();
  const [form, setForm] = useState<CompanyProfile>(profile);
  const [base, setBase] = useState<CompanyProfile>(profile);
  const [saved, setSaved] = useState(false);
  const [logoError, setLogoError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Réinitialise le formulaire quand le profil stocké change (chargement /
  // sauvegarde). Ajustement d'état pendant le rendu — sans effet.
  if (profile !== base) {
    setBase(profile);
    setForm(profile);
  }

  function update<K extends keyof CompanyProfile>(
    key: K,
    value: CompanyProfile[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLogoError("Choisissez une image.");
      return;
    }
    if (file.size > 1_500_000) {
      setLogoError("Image trop lourde (max 1,5 Mo).");
      return;
    }
    setLogoError("");
    const reader = new FileReader();
    reader.onload = () => update("logo", String(reader.result));
    reader.readAsDataURL(file);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    save(form);
    setSaved(true);
    toast("Profil enregistré");
  }

  return (
    <>
      <PageHeader
        title="Profil entreprise"
        subtitle="Ces informations apparaissent automatiquement sur vos documents."
      />

      <Card className="p-6 sm:p-8">
        {/* Logo */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="border-line bg-mist relative inline-flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border">
            {form.logo ? (
              <Image
                src={form.logo}
                alt="Logo"
                fill
                unoptimized
                className="object-contain"
              />
            ) : (
              <Building2 size={28} className="text-brand" />
            )}
          </div>
          <div>
            <p className="text-ink text-sm font-medium">Logo de l&apos;entreprise</p>
            <p className="text-muted text-xs">PNG ou JPG, jusqu&apos;à 1,5 Mo.</p>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={15} />
                {form.logo ? "Changer" : "Ajouter"}
              </Button>
              {form.logo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => update("logo", "")}
                >
                  <Trash2 size={15} />
                  Retirer
                </Button>
              )}
            </div>
            {logoError && (
              <p className="mt-1.5 text-xs text-red-500">{logoError}</p>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onLogo}
              className="hidden"
            />
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Nom de l'entreprise"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Ex. Plomberie Martin"
            />
            <Input
              label="Métier"
              value={form.trade}
              onChange={(e) => update("trade", e.target.value)}
              placeholder="Ex. Plombier"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Adresse e-mail"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="contact@entreprise.fr"
            />
            <Input
              label="Téléphone"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="06 12 34 56 78"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="SIRET"
              value={form.siret}
              onChange={(e) => update("siret", e.target.value)}
              placeholder="123 456 789 00012"
            />
            <Input
              label="N° TVA intracommunautaire"
              value={form.vat}
              onChange={(e) => update("vat", e.target.value)}
              placeholder="FR 12 345678900"
            />
          </div>
          <Input
            label="Adresse"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="12 rue des Artisans, 75000 Paris"
          />

          <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
            {saved && (
              <span className="text-brand inline-flex items-center justify-center gap-1.5 text-sm font-medium">
                <Check size={16} />
                Enregistré
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setForm(profile);
                setSaved(false);
              }}
            >
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
