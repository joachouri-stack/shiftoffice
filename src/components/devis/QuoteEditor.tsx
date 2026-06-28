"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatEUR, newId, type Quote, type QuoteLine } from "@/lib/quote-core";
import type { CompanyProfile } from "@/lib/companyProfile";

/** Ligne en cours d'édition : qty/prix en texte pour une saisie fluide. */
type EditLine = {
  id: string;
  designation: string;
  unit: string;
  qty: string;
  unitPrice: string;
  vat: number;
  kind: QuoteLine["kind"];
  purchasePrice: number;
};

const numFromText = (t: string) => parseFloat(t.replace(",", ".")) || 0;

export function QuoteEditor({
  open,
  onClose,
  quote,
  profile,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  quote: Quote;
  profile: CompanyProfile;
  onSave: (q: Quote) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Modifier le devis"
      className="sm:max-w-2xl"
    >
      {/* Remonté à chaque ouverture : l'état repart du devis courant. */}
      <EditorForm
        quote={quote}
        franchise={!profile.vatLiable}
        onSave={onSave}
        onClose={onClose}
      />
    </Modal>
  );
}

function EditorForm({
  quote,
  franchise,
  onSave,
  onClose,
}: {
  quote: Quote;
  franchise: boolean;
  onSave: (q: Quote) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(quote.title);
  const [clientName, setClientName] = useState(quote.clientName);
  const [clientAddress, setClientAddress] = useState(quote.clientAddress);
  const [clientEmail, setClientEmail] = useState(quote.clientEmail);
  const [discount, setDiscount] = useState(String(quote.discount || 0));
  const [lines, setLines] = useState<EditLine[]>(
    quote.lines.map((l) => ({
      id: l.id,
      designation: l.designation,
      unit: l.unit,
      qty: String(l.qty),
      unitPrice: String(l.unitPrice),
      vat: l.vat,
      kind: l.kind,
      purchasePrice: l.purchasePrice,
    }))
  );

  function setLine<K extends keyof EditLine>(i: number, key: K, v: EditLine[K]) {
    setLines((arr) => arr.map((l, j) => (j === i ? { ...l, [key]: v } : l)));
  }
  function removeLine(i: number) {
    setLines((arr) => arr.filter((_, j) => j !== i));
  }
  function addLine() {
    setLines((arr) => [
      ...arr,
      {
        id: newId(),
        designation: "",
        unit: "u",
        qty: "1",
        unitPrice: "0",
        vat: franchise ? 0 : 10,
        kind: "material",
        purchasePrice: 0,
      },
    ]);
  }

  const totalHT = lines.reduce(
    (s, l) => s + numFromText(l.qty) * numFromText(l.unitPrice),
    0
  );

  function save() {
    const cleanLines: QuoteLine[] = lines
      .filter((l) => l.designation.trim() !== "")
      .map((l) => ({
        id: l.id,
        kind: l.kind,
        designation: l.designation.trim(),
        description: "",
        qty: numFromText(l.qty),
        unit: l.unit || "u",
        unitPrice: numFromText(l.unitPrice),
        purchasePrice: l.purchasePrice,
        vat: franchise ? 0 : l.vat,
      }));
    onSave({
      ...quote,
      title,
      clientName,
      clientAddress,
      clientEmail,
      discount: Math.max(0, Math.min(100, numFromText(discount))),
      lines: cleanLines,
    });
  }

  const inputCls =
    "border-line bg-paper text-ink placeholder:text-muted/60 focus:border-brand focus:ring-brand/10 h-10 w-full rounded-lg border px-2.5 text-sm outline-none transition-all focus:ring-2";

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Objet du devis"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex. Rénovation salle de bain"
        />
        <Input
          label="Client"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Nom du client"
        />
        <Input
          label="Adresse client"
          value={clientAddress}
          onChange={(e) => setClientAddress(e.target.value)}
          placeholder="Adresse"
        />
        <Input
          label="Email client"
          type="email"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          placeholder="client@email.fr"
        />
      </div>

      {/* Lignes */}
      <div>
        <p className="text-ink mb-2 text-sm font-medium">Lignes du devis</p>
        <div className="space-y-2.5">
          {lines.map((l, i) => (
            <div
              key={l.id}
              className="border-line bg-mist/30 rounded-xl border p-2.5"
            >
              <div className="flex items-center gap-2">
                <input
                  value={l.designation}
                  onChange={(e) => setLine(i, "designation", e.target.value)}
                  placeholder="Désignation"
                  className={inputCls + " flex-1"}
                />
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  aria-label="Supprimer la ligne"
                  className="text-muted hover:bg-red-50 hover:text-red-500 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <LabeledMini label="Qté">
                  <input
                    inputMode="decimal"
                    value={l.qty}
                    onChange={(e) => setLine(i, "qty", e.target.value)}
                    className={inputCls}
                  />
                </LabeledMini>
                <LabeledMini label="Unité">
                  <input
                    value={l.unit}
                    onChange={(e) => setLine(i, "unit", e.target.value)}
                    className={inputCls}
                  />
                </LabeledMini>
                <LabeledMini label="P.U. HT (€)">
                  <input
                    inputMode="decimal"
                    value={l.unitPrice}
                    onChange={(e) => setLine(i, "unitPrice", e.target.value)}
                    className={inputCls}
                  />
                </LabeledMini>
                {!franchise && (
                  <LabeledMini label="TVA">
                    <select
                      value={l.vat}
                      onChange={(e) =>
                        setLine(i, "vat", parseFloat(e.target.value))
                      }
                      className={inputCls}
                    >
                      {[20, 10, 5.5].map((r) => (
                        <option key={r} value={r}>
                          {r}%
                        </option>
                      ))}
                    </select>
                  </LabeledMini>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addLine}
          className="text-brand hover:bg-brand-50 mt-2.5 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Ajouter une ligne
        </button>
      </div>

      {/* Remise + total */}
      <div className="border-line flex flex-wrap items-end justify-between gap-3 border-t pt-4">
        <div className="w-28">
          <label className="text-ink mb-1.5 block text-sm font-medium">
            Remise (%)
          </label>
          <input
            inputMode="decimal"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className={inputCls}
          />
        </div>
        <p className="text-ink text-sm font-semibold tabular">
          Total HT : {formatEUR(totalHT)} €
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="button" onClick={save}>
          Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
}

function LabeledMini({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="text-muted mb-1 block text-xs">{label}</span>
      {children}
    </div>
  );
}
