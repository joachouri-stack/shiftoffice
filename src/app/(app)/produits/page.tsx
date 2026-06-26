"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Plus, Search, Package, Pencil, Trash2, Upload } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/app/PageHeader";
import { useToast } from "@/components/ui/Toast";
import {
  useProducts,
  PRODUCT_UNITS,
  VAT_RATES,
  type Product,
} from "@/lib/products";

type Draft = Omit<Product, "id">;

const EMPTY_DRAFT: Draft = {
  name: "",
  reference: "",
  supplier: "",
  unit: "u",
  price: 0,
  vat: 20,
  photo: "",
};

const eur = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ProduitsPage() {
  const { products, add, update, remove } = useProducts();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.name, p.reference, p.supplier]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [products, query]);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setOpen(true);
  }
  function submit(draft: Draft) {
    if (editing) {
      update(editing.id, draft);
      toast("Produit modifié");
    } else {
      add(draft);
      toast("Produit ajouté");
    }
    setOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Bibliothèque produits"
        subtitle="Vos matériaux, réutilisés automatiquement dans vos devis."
        action={
          <Button size="sm" onClick={openNew}>
            <Plus size={16} />
            Ajouter
          </Button>
        }
      />

      {products.length > 0 && (
        <div className="mb-5">
          <div className="border-line bg-paper focus-within:border-brand focus-within:ring-brand/10 flex h-11 items-center gap-2.5 rounded-xl border px-3.5 transition-all focus-within:ring-4">
            <Search size={18} className="text-muted shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit…"
              className="text-ink placeholder:text-muted/70 w-full bg-transparent text-[0.95rem] outline-none"
            />
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <Card className="flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
          <div className="bg-brand-50 text-brand inline-flex h-14 w-14 items-center justify-center rounded-2xl">
            <Package size={26} />
          </div>
          <h2 className="text-ink mt-5 text-xl font-semibold tracking-tight">
            Votre bibliothèque est vide
          </h2>
          <p className="text-muted mt-2 max-w-md text-[0.95rem]">
            Ajoutez vos matériaux (ciment, placo, peinture…) avec leur prix.
            Vous gagnerez du temps à chaque devis.
          </p>
          <Button className="mt-6" onClick={openNew}>
            <Plus size={16} />
            Ajouter un produit
          </Button>
        </Card>
      ) : (
        <Card className="divide-line divide-y">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="hover:bg-mist/50 flex items-center gap-3 px-4 py-3.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl sm:px-5"
            >
              <div className="border-line bg-mist text-muted relative inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
                {p.photo ? (
                  <Image
                    src={p.photo}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <Package size={18} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-ink truncate text-sm font-medium">{p.name}</p>
                <p className="text-muted truncate text-xs">
                  {[p.reference, p.supplier].filter(Boolean).join(" · ") ||
                    "—"}
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-ink text-sm font-semibold tabular">
                  {eur(p.price)} € <span className="text-muted">/ {p.unit}</span>
                </p>
                <Badge variant="neutral" className="mt-0.5">
                  TVA {p.vat}%
                </Badge>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  aria-label="Modifier"
                  className="text-muted hover:bg-mist hover:text-ink inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    remove(p.id);
                    toast("Produit supprimé", "info");
                  }}
                  aria-label="Supprimer"
                  className="text-muted inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-muted px-5 py-10 text-center text-sm">
              Aucun produit ne correspond à « {query} ».
            </p>
          )}
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Modifier le produit" : "Nouveau produit"}
      >
        <ProductForm
          initial={editing ?? EMPTY_DRAFT}
          onSubmit={submit}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}

function ProductForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: Draft;
  onSubmit: (d: Draft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [priceText, setPriceText] = useState(
    initial.price ? String(initial.price) : ""
  );
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || file.size > 1_500_000)
      return;
    const reader = new FileReader();
    reader.onload = () => set("photo", String(reader.result));
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ ...draft, price: parseFloat(priceText.replace(",", ".")) || 0 });
  }

  const selectClass =
    "border-line bg-paper text-ink h-11 w-full rounded-xl border px-3 text-[0.95rem] outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="border-line bg-mist text-muted relative inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border">
          {draft.photo ? (
            <Image
              src={draft.photo}
              alt=""
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <Package size={22} />
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={15} />
          {draft.photo ? "Changer la photo" : "Ajouter une photo"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onPhoto}
          className="hidden"
        />
      </div>

      <Input
        label="Nom du produit"
        value={draft.name}
        onChange={(e) => set("name", e.target.value)}
        placeholder="Ex. Plaque de placo BA13"
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Référence"
          value={draft.reference}
          onChange={(e) => set("reference", e.target.value)}
          placeholder="Ex. BA13-250"
        />
        <Input
          label="Fournisseur"
          value={draft.supplier}
          onChange={(e) => set("supplier", e.target.value)}
          placeholder="Ex. Point P"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="text-ink mb-1.5 block text-sm font-medium">
            Prix HT (€)
          </label>
          <input
            inputMode="decimal"
            value={priceText}
            onChange={(e) => setPriceText(e.target.value)}
            placeholder="0,00"
            className="border-line bg-paper text-ink placeholder:text-muted/70 focus:border-brand focus:ring-brand/10 h-11 w-full rounded-xl border px-4 text-[0.95rem] outline-none transition-all focus:ring-4"
          />
        </div>
        <div>
          <label className="text-ink mb-1.5 block text-sm font-medium">
            Unité
          </label>
          <select
            value={draft.unit}
            onChange={(e) => set("unit", e.target.value)}
            className={selectClass}
          >
            {PRODUCT_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-ink mb-1.5 block text-sm font-medium">
            TVA
          </label>
          <select
            value={draft.vat}
            onChange={(e) => set("vat", parseFloat(e.target.value))}
            className={selectClass}
          >
            {VAT_RATES.map((r) => (
              <option key={r} value={r}>
                {r} %
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {initial.name ? "Enregistrer" : "Ajouter le produit"}
        </Button>
      </div>
    </form>
  );
}
