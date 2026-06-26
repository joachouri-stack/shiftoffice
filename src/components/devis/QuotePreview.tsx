"use client";

import Image from "next/image";
import { computeTotals, formatEUR, type Quote } from "@/lib/quote-core";
import type { CompanyProfile } from "@/lib/companyProfile";

export function QuotePreview({
  quote,
  profile,
}: {
  quote: Quote;
  profile: CompanyProfile;
}) {
  const t = computeTotals(quote);
  const isInvoice = quote.type === "facture";
  const docLabel = isInvoice ? "FACTURE" : "DEVIS";
  const dateStr = quote.createdAt
    ? new Date(quote.createdAt).toLocaleDateString("fr-FR")
    : new Date().toLocaleDateString("fr-FR");

  return (
    <div className="print-area bg-paper text-ink mx-auto w-full max-w-[800px] p-6 text-[13px] leading-relaxed sm:p-10">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-3">
          {profile.logo ? (
            <span className="border-line relative inline-block h-14 w-14 shrink-0 overflow-hidden rounded-xl border">
              <Image src={profile.logo} alt="" fill unoptimized className="object-contain" />
            </span>
          ) : null}
          <div>
            <p className="text-ink text-base font-semibold">
              {profile.name || "Votre entreprise"}
            </p>
            {profile.trade && <p className="text-muted">{profile.trade}</p>}
            {profile.address && <p className="text-muted">{profile.address}</p>}
            <p className="text-muted">
              {[profile.phone, profile.email].filter(Boolean).join(" · ")}
            </p>
            {profile.siret && <p className="text-muted">SIRET {profile.siret}</p>}
            {profile.vat && <p className="text-muted">TVA {profile.vat}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-brand text-xl font-bold tracking-tight">{docLabel}</p>
          <p className="text-ink mt-1 font-medium">{quote.number || "(brouillon)"}</p>
          <p className="text-muted">Le {dateStr}</p>
        </div>
      </div>

      {/* Client + titre */}
      <div className="border-line mt-6 flex flex-wrap items-end justify-between gap-4 border-t pt-5">
        <div>
          <p className="text-muted text-xs uppercase tracking-wide">Client</p>
          <p className="text-ink font-medium">{quote.clientName || "—"}</p>
          {quote.clientAddress && <p className="text-muted">{quote.clientAddress}</p>}
          {quote.clientEmail && <p className="text-muted">{quote.clientEmail}</p>}
        </div>
        {quote.title && (
          <p className="text-ink max-w-[60%] text-right font-serif text-base font-medium">
            {quote.title}
          </p>
        )}
      </div>

      {/* Lignes */}
      <table className="mt-6 w-full border-collapse">
        <thead>
          <tr className="border-line text-muted border-b text-left text-xs uppercase tracking-wide">
            <th className="py-2 pr-2 font-medium">Désignation</th>
            <th className="py-2 px-2 text-right font-medium">Qté</th>
            <th className="py-2 px-2 text-right font-medium">P.U. HT</th>
            <th className="py-2 px-2 text-right font-medium">TVA</th>
            <th className="py-2 pl-2 text-right font-medium">Total HT</th>
          </tr>
        </thead>
        <tbody>
          {quote.lines.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-muted py-8 text-center">
                Décrivez votre chantier à l&apos;assistant pour générer les
                lignes automatiquement.
              </td>
            </tr>
          ) : (
            quote.lines.map((l) => (
              <tr key={l.id} className="border-line/70 border-b align-top">
                <td className="py-2.5 pr-2">
                  <p className="text-ink font-medium">{l.designation}</p>
                  {l.description && (
                    <p className="text-muted text-xs">{l.description}</p>
                  )}
                </td>
                <td className="py-2.5 px-2 text-right tabular whitespace-nowrap">
                  {formatEUR(l.qty).replace(",00", "")} {l.unit}
                </td>
                <td className="py-2.5 px-2 text-right tabular whitespace-nowrap">
                  {formatEUR(l.unitPrice)} €
                </td>
                <td className="py-2.5 px-2 text-right tabular">{l.vat}%</td>
                <td className="py-2.5 pl-2 text-right tabular whitespace-nowrap font-medium">
                  {formatEUR(l.qty * l.unitPrice)} €
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Totaux */}
      <div className="mt-5 flex justify-end">
        <div className="w-full max-w-[280px] space-y-1.5 text-[13px]">
          <Row label="Sous-total HT" value={`${formatEUR(t.subtotalHT)} €`} />
          {quote.discount > 0 && (
            <Row
              label={`Remise (${quote.discount}%)`}
              value={`− ${formatEUR(t.discountAmount)} €`}
            />
          )}
          {quote.discount > 0 && (
            <Row label="Net HT" value={`${formatEUR(t.netHT)} €`} />
          )}
          {t.vatByRate.map((v) => (
            <Row
              key={v.rate}
              label={`TVA ${v.rate}%`}
              value={`${formatEUR(v.amount)} €`}
              muted
            />
          ))}
          <div className="border-line mt-1 border-t pt-2">
            <Row
              label="Total TTC"
              value={`${formatEUR(t.totalTTC)} €`}
              strong
            />
          </div>
        </div>
      </div>

      {/* Pied */}
      <div className="border-line text-muted mt-8 space-y-1 border-t pt-5 text-xs">
        {!isInvoice && quote.validityDays > 0 && (
          <p>Devis valable {quote.validityDays} jours.</p>
        )}
        {quote.paymentTerms && <p>{quote.paymentTerms}</p>}
        {quote.notes && <p className="text-ink">{quote.notes}</p>}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted" : "text-ink"}>{label}</span>
      <span
        className={`tabular ${
          strong ? "text-ink text-base font-semibold" : "text-ink font-medium"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
