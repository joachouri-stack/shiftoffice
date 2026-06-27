import Anthropic from "@anthropic-ai/sdk";
import {
  computeTotals,
  newId,
  type Quote,
  type QuoteLine,
  type LineKind,
} from "@/lib/quote-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-opus-4-8";

const KINDS: LineKind[] = [
  "material",
  "labor",
  "travel",
  "rental",
  "service",
  "other",
];

/* ---------------- Outils exposés à l'IA ---------------- */

const lineProps = {
  designation: { type: "string", description: "Intitulé court de la ligne" },
  description: { type: "string", description: "Détail optionnel" },
  qty: { type: "number", description: "Quantité" },
  unit: { type: "string", description: "Unité (u, m², ml, h, forfait…)" },
  unitPrice: { type: "number", description: "Prix unitaire HT (vente) en €" },
  purchasePrice: {
    type: "number",
    description: "Prix d'achat unitaire HT en € (0 si inconnu) — sert à la marge",
  },
  vat: { type: "number", description: "Taux de TVA : 20, 10 ou 5.5" },
  kind: {
    type: "string",
    enum: KINDS,
    description:
      "material (matériaux), labor (main-d'œuvre), travel (déplacement), rental (location), service (prestation), other",
  },
};

const TOOLS: Anthropic.Tool[] = [
  {
    name: "set_header",
    description:
      "Définit/modifie l'en-tête du devis : titre, client, validité, conditions.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        clientName: { type: "string" },
        clientAddress: { type: "string" },
        clientEmail: { type: "string" },
        validityDays: { type: "number" },
        paymentTerms: { type: "string" },
      },
    },
  },
  {
    name: "add_lines",
    description:
      "Ajoute une ou plusieurs lignes au devis. Propose des lignes complètes et réalistes pour le métier.",
    input_schema: {
      type: "object",
      properties: {
        lines: {
          type: "array",
          items: {
            type: "object",
            properties: lineProps,
            required: ["designation", "qty", "unit", "unitPrice", "vat"],
          },
        },
      },
      required: ["lines"],
    },
  },
  {
    name: "update_line",
    description:
      "Modifie une ligne existante par son numéro (1 = première ligne). Ne renseigner que les champs à changer.",
    input_schema: {
      type: "object",
      properties: { index: { type: "number" }, ...lineProps },
      required: ["index"],
    },
  },
  {
    name: "remove_line",
    description: "Supprime une ligne par son numéro (1 = première ligne).",
    input_schema: {
      type: "object",
      properties: { index: { type: "number" } },
      required: ["index"],
    },
  },
  {
    name: "set_discount",
    description: "Applique une remise globale en pourcentage (0 pour retirer).",
    input_schema: {
      type: "object",
      properties: { percent: { type: "number" } },
      required: ["percent"],
    },
  },
  {
    name: "clear_lines",
    description: "Vide toutes les lignes du devis.",
    input_schema: { type: "object", properties: {} },
  },
];

/* ---------------- Application des outils ---------------- */

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toLine(raw: Record<string, unknown>): QuoteLine {
  const kind = (raw.kind as LineKind) ?? "material";
  return {
    id: newId(),
    kind: KINDS.includes(kind) ? kind : "material",
    designation: String(raw.designation ?? "").slice(0, 200),
    description: String(raw.description ?? "").slice(0, 500),
    qty: num(raw.qty, 1),
    unit: String(raw.unit ?? "u").slice(0, 12),
    unitPrice: num(raw.unitPrice),
    purchasePrice: num(raw.purchasePrice),
    vat: [20, 10, 5.5].includes(num(raw.vat)) ? num(raw.vat) : 20,
  };
}

function applyTool(
  quote: Quote,
  name: string,
  input: Record<string, unknown>
): Quote {
  const q: Quote = { ...quote, lines: [...quote.lines] };
  switch (name) {
    case "set_header": {
      if (input.title !== undefined) q.title = String(input.title);
      if (input.clientName !== undefined) q.clientName = String(input.clientName);
      if (input.clientAddress !== undefined)
        q.clientAddress = String(input.clientAddress);
      if (input.clientEmail !== undefined)
        q.clientEmail = String(input.clientEmail);
      if (input.validityDays !== undefined)
        q.validityDays = num(input.validityDays, 30);
      if (input.paymentTerms !== undefined)
        q.paymentTerms = String(input.paymentTerms);
      return q;
    }
    case "add_lines": {
      const arr = Array.isArray(input.lines) ? input.lines : [];
      q.lines.push(...arr.map((l) => toLine(l as Record<string, unknown>)));
      return q;
    }
    case "update_line": {
      const i = num(input.index, 0) - 1;
      if (i < 0 || i >= q.lines.length) return q;
      const cur = q.lines[i];
      const patch: Partial<QuoteLine> = {};
      if (input.designation !== undefined)
        patch.designation = String(input.designation);
      if (input.description !== undefined)
        patch.description = String(input.description);
      if (input.qty !== undefined) patch.qty = num(input.qty, cur.qty);
      if (input.unit !== undefined) patch.unit = String(input.unit);
      if (input.unitPrice !== undefined)
        patch.unitPrice = num(input.unitPrice, cur.unitPrice);
      if (input.purchasePrice !== undefined)
        patch.purchasePrice = num(input.purchasePrice, cur.purchasePrice);
      if (input.vat !== undefined) patch.vat = num(input.vat, cur.vat);
      if (input.kind !== undefined && KINDS.includes(input.kind as LineKind))
        patch.kind = input.kind as LineKind;
      q.lines[i] = { ...cur, ...patch };
      return q;
    }
    case "remove_line": {
      const i = num(input.index, 0) - 1;
      if (i >= 0 && i < q.lines.length) q.lines.splice(i, 1);
      return q;
    }
    case "set_discount": {
      q.discount = Math.max(0, Math.min(100, num(input.percent)));
      return q;
    }
    case "clear_lines": {
      q.lines = [];
      return q;
    }
    default:
      return q;
  }
}

/* ---------------- Prompt système ---------------- */

function buildSystem(
  profile: Record<string, unknown>,
  products: unknown[],
  clients: unknown[],
  quote: Quote
): string {
  const t = computeTotals(quote);
  const lines = quote.lines
    .map(
      (l, i) =>
        `${i + 1}. ${l.designation} — ${l.qty} ${l.unit} × ${l.unitPrice}€ HT (TVA ${l.vat}%, achat ${l.purchasePrice}€, ${l.kind})`
    )
    .join("\n");

  return `Tu es le moteur IA de devis de Shift Office : un collaborateur expert du bâtiment qui construit les devis des artisans à leur place, par la conversation.

RÈGLES :
- Tu modifies le devis UNIQUEMENT via les outils fournis (set_header, add_lines, update_line, remove_line, set_discount, clear_lines). N'écris jamais le devis en texte : appelle les outils.
- Quand on te demande un ouvrage (ex. « douche italienne »), propose un ensemble de lignes COMPLET et réaliste : matériaux nécessaires, fournitures, main-d'œuvre, déplacement. Une ligne par poste.
- Utilise EN PRIORITÉ la bibliothèque produits de l'artisan (prix de vente, prix d'achat, TVA, unité). Si un poste n'y figure pas, estime un prix de marché cohérent pour le métier et renseigne un prix d'achat plausible (pour calculer la marge).
- TVA : 10% par défaut en rénovation de logement de +2 ans, 20% sinon (neuf, fournitures seules), 5,5% pour la rénovation énergétique. Dans le doute, 10% pour la main-d'œuvre de rénovation.
- Pour la main-d'œuvre, kind="labor" ; déplacement kind="travel" ; matériaux kind="material".
- Après tes actions, réponds en 1-3 phrases en français : ce que tu as fait, et propose la suite (ex. ajuster une quantité, un prix). Si une info essentielle manque (nom du client), demande-la simplement, sans bloquer la création des lignes.
- CLIENTS : si l'artisan nomme un client présent dans le RÉPERTOIRE ci-dessous, renseigne automatiquement l'en-tête (nom, adresse, email) via set_header à partir de ses coordonnées. Ne réclame pas une info déjà connue du répertoire.
- Sois concis, pratique et fiable. L'artisan vérifiera les montants importants.

PROFIL ENTREPRISE : ${JSON.stringify(profile)}

BIBLIOTHÈQUE PRODUITS (${products.length}) : ${JSON.stringify(products).slice(0, 6000)}

RÉPERTOIRE CLIENTS (${clients.length}) : ${JSON.stringify(clients).slice(0, 3000)}

DEVIS ACTUEL — n°${quote.number || "(nouveau)"}, titre "${quote.title || "—"}", client "${quote.clientName || "—"}", remise ${quote.discount}% :
${lines || "(aucune ligne)"}
Total TTC actuel : ${t.totalTTC.toFixed(2)} €`;
}

/* ---------------- Route ---------------- */

type InMsg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  let body: {
    messages?: InMsg[];
    quote?: Quote;
    profile?: Record<string, unknown>;
    products?: unknown[];
    clients?: unknown[];
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const quote = body.quote;
  const messages = (body.messages ?? []).filter(
    (m) =>
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim()
  );
  if (!quote || messages.length === 0) {
    return Response.json({ error: "Données manquantes." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({
      reply:
        "Le moteur IA n'est pas encore activé sur ce serveur. Ajoutez la clé ANTHROPIC_API_KEY pour générer vos devis par la conversation.",
      quote,
    });
  }

  const client = new Anthropic({ apiKey });
  let working = quote;
  const convo: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  let reply = "";

  try {
    for (let step = 0; step < 6; step++) {
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: buildSystem(
          body.profile ?? {},
          body.products ?? [],
          body.clients ?? [],
          working
        ),
        tools: TOOLS,
        messages: convo,
      });

      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      if (text) reply += (reply ? "\n" : "") + text;

      if (res.stop_reason !== "tool_use") break;

      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const block of res.content) {
        if (block.type === "tool_use") {
          working = applyTool(
            working,
            block.name,
            block.input as Record<string, unknown>
          );
          const tt = computeTotals(working);
          results.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify({
              ok: true,
              lines: working.lines.length,
              totalTTC: Math.round(tt.totalTTC * 100) / 100,
            }),
          });
        }
      }
      convo.push({ role: "assistant", content: res.content });
      convo.push({ role: "user", content: results });
    }
  } catch (err) {
    const msg =
      err instanceof Anthropic.APIError
        ? `Erreur du moteur IA (${err.status}). Réessayez.`
        : "Une erreur est survenue. Réessayez.";
    return Response.json({ reply: msg, quote: working });
  }

  return Response.json({
    reply: reply || "C'est fait.",
    quote: working,
  });
}
