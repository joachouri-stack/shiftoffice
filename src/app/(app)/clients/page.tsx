"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Users,
  UserRound,
  Building2,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/app/PageHeader";
import { useToast } from "@/components/ui/Toast";
import {
  useClients,
  type Client,
  type ClientType,
} from "@/lib/clients";
import { cn } from "@/lib/utils";

type Draft = Omit<Client, "id">;

const EMPTY_DRAFT: Draft = {
  name: "",
  type: "particulier",
  email: "",
  phone: "",
  address: "",
  postalCode: "",
  city: "",
  siret: "",
  notes: "",
};

export default function ClientsPage() {
  const { clients, add, update, remove } = useClients();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.name, c.email, c.phone, c.city]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [clients, query]);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(c: Client) {
    setEditing(c);
    setOpen(true);
  }
  function submit(draft: Draft) {
    if (editing) {
      update(editing.id, draft);
      toast("Client modifié");
    } else {
      add(draft);
      toast("Client ajouté");
    }
    setOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle="Votre répertoire, réutilisé dans vos devis et factures."
        action={
          <Button size="sm" onClick={openNew}>
            <Plus size={16} />
            Ajouter
          </Button>
        }
      />

      {clients.length > 0 && (
        <div className="mb-5">
          <div className="border-line bg-paper focus-within:border-brand focus-within:ring-brand/10 flex h-11 items-center gap-2.5 rounded-xl border px-3.5 transition-all focus-within:ring-4">
            <Search size={18} className="text-muted shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un client…"
              className="text-ink placeholder:text-muted/70 w-full bg-transparent text-[0.95rem] outline-none"
            />
          </div>
        </div>
      )}

      {clients.length === 0 ? (
        <Card className="flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
          <div className="bg-brand-50 text-brand inline-flex h-14 w-14 items-center justify-center rounded-2xl">
            <Users size={26} />
          </div>
          <h2 className="text-ink mt-5 text-xl font-semibold tracking-tight">
            Aucun client pour l&apos;instant
          </h2>
          <p className="text-muted mt-2 max-w-md text-[0.95rem]">
            Ajoutez vos clients une fois, puis sélectionnez-les en un clic à
            chaque devis ou facture.
          </p>
          <Button className="mt-6" onClick={openNew}>
            <Plus size={16} />
            Ajouter un client
          </Button>
        </Card>
      ) : (
        <Card className="divide-line divide-y">
          {filtered.map((c) => {
            const pro = c.type === "professionnel";
            return (
              <div
                key={c.id}
                className="hover:bg-mist/50 flex items-center gap-3 px-4 py-3.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl sm:px-5"
              >
                <span
                  className={cn(
                    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                    pro
                      ? "bg-ink/5 text-ink"
                      : "bg-brand-50 text-brand"
                  )}
                >
                  {pro ? <Building2 size={18} /> : <UserRound size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink truncate text-sm font-medium">
                    {c.name || "Sans nom"}
                  </p>
                  <p className="text-muted truncate text-xs">
                    {[c.email, c.phone].filter(Boolean).join(" · ") ||
                      [c.postalCode, c.city].filter(Boolean).join(" ") ||
                      "—"}
                  </p>
                </div>
                <Badge variant="neutral" className="hidden sm:inline-flex">
                  {pro ? "Pro" : "Particulier"}
                </Badge>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    aria-label="Modifier"
                    className="text-muted hover:bg-mist hover:text-ink inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      remove(c.id);
                      toast("Client supprimé", "info");
                    }}
                    aria-label="Supprimer"
                    className="text-muted inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-muted px-5 py-10 text-center text-sm">
              Aucun client ne correspond à « {query} ».
            </p>
          )}
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Modifier le client" : "Nouveau client"}
      >
        <ClientForm
          initial={editing ?? EMPTY_DRAFT}
          onSubmit={submit}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}

function ClientForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: Draft;
  onSubmit: (d: Draft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(draft);
  }

  const TYPES: { value: ClientType; label: string; icon: typeof UserRound }[] = [
    { value: "particulier", label: "Particulier", icon: UserRound },
    { value: "professionnel", label: "Professionnel", icon: Building2 },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type de client */}
      <div className="grid grid-cols-2 gap-2.5">
        {TYPES.map((t) => {
          const active = draft.type === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => set("type", t.value)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-all duration-200",
                active
                  ? "border-brand bg-brand text-paper shadow-[var(--shadow-brand)]"
                  : "border-line bg-paper text-ink hover:border-brand/40"
              )}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      <Input
        label={
          draft.type === "professionnel"
            ? "Nom de l'entreprise"
            : "Nom du client"
        }
        value={draft.name}
        onChange={(e) => set("name", e.target.value)}
        placeholder={
          draft.type === "professionnel"
            ? "Ex. Dupont Bâtiment"
            : "Ex. Jean Dupont"
        }
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Email"
          type="email"
          value={draft.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="client@email.fr"
        />
        <Input
          label="Téléphone"
          type="tel"
          value={draft.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="06 12 34 56 78"
        />
      </div>

      <Input
        label="Adresse"
        value={draft.address}
        onChange={(e) => set("address", e.target.value)}
        placeholder="12 rue des Lilas"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Code postal"
          value={draft.postalCode}
          onChange={(e) => set("postalCode", e.target.value)}
          placeholder="75000"
          inputMode="numeric"
        />
        <Input
          label="Ville"
          value={draft.city}
          onChange={(e) => set("city", e.target.value)}
          placeholder="Paris"
        />
      </div>

      {draft.type === "professionnel" && (
        <Input
          label="SIRET"
          value={draft.siret}
          onChange={(e) => set("siret", e.target.value)}
          placeholder="123 456 789 00012"
        />
      )}

      <div>
        <label className="text-ink mb-1.5 block text-sm font-medium">
          Notes
        </label>
        <textarea
          value={draft.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          placeholder="Informations utiles (accès chantier, préférences…)"
          className="border-line bg-paper text-ink placeholder:text-muted/70 focus:border-brand focus:ring-brand/10 w-full resize-none rounded-xl border px-4 py-2.5 text-[0.95rem] outline-none transition-all focus:ring-4"
        />
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {initial.name ? "Enregistrer" : "Ajouter le client"}
        </Button>
      </div>
    </form>
  );
}
