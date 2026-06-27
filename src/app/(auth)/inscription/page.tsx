"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCompanyProfile } from "@/lib/companyProfile";

const PERKS = [
  "Essai gratuit, sans carte bancaire",
  "Assistant IA dès la première minute",
  "Résiliable à tout moment",
];

export default function InscriptionPage() {
  const router = useRouter();
  const { profile, save } = useCompanyProfile();
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // V1 — pré-remplit le profil avec les infos saisies, puis lance l'onboarding.
    const data = new FormData(e.currentTarget as HTMLFormElement);
    save({
      ...profile,
      name: String(data.get("company") || profile.name),
      email: String(data.get("email") || profile.email),
    });
    setTimeout(() => router.push("/onboarding"), 600);
  }

  return (
    <Card className="p-7 sm:p-9">
      <div className="text-center">
        <h1 className="text-ink text-2xl font-semibold tracking-tight">
          Créez votre compte
        </h1>
        <p className="text-muted mt-2 text-sm">
          Quelques secondes suffisent. Vraiment.
        </p>
      </div>

      <ul className="bg-mist/70 mt-6 space-y-2.5 rounded-2xl p-4">
        {PERKS.map((perk) => (
          <li key={perk} className="flex items-center gap-2.5 text-sm">
            <span className="bg-brand-50 text-brand inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
              <Check size={13} strokeWidth={3} />
            </span>
            <span className="text-ink/90">{perk}</span>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          label="Nom de l'entreprise"
          name="company"
          autoComplete="organization"
          placeholder="Ex. Plomberie Martin"
          required
        />
        <Input
          label="Adresse e-mail"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="vous@entreprise.fr"
          required
        />
        <Input
          label="Mot de passe"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          minLength={8}
          required
        />

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Création…" : "Créer mon compte"}
        </Button>
      </form>

      <p className="text-muted mt-5 text-center text-xs leading-relaxed">
        En créant un compte, vous acceptez nos{" "}
        <Link href="/cgu" className="text-ink underline underline-offset-2">
          CGU
        </Link>{" "}
        et notre{" "}
        <Link
          href="/confidentialite"
          className="text-ink underline underline-offset-2"
        >
          politique de confidentialité
        </Link>
        .
      </p>

      <p className="text-muted mt-6 text-center text-sm">
        Déjà inscrit ?{" "}
        <Link
          href="/connexion"
          className="text-brand hover:text-brand-600 font-medium"
        >
          Se connecter
        </Link>
      </p>
    </Card>
  );
}
