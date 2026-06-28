import Anthropic from "@anthropic-ai/sdk";
import { newId, type QuoteLine, type LineKind } from "@/lib/quote-core";
import {
  QUESTIONS_METIER,
  detectTradeKey,
  type TradeQuestion,
} from "@/lib/trade-questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Modèle imposé par le spec pour l'assistant (coût maîtrisé).
const MODEL = "claude-sonnet-4-6";

type InMsg = { role: "user" | "assistant"; content: string };

type Profile = {
  name?: string;
  trade?: string;
  fiscalRegime?: string;
  vatLiable?: boolean;
  vatRate?: number;
};

/* ----------------------------- Mapping lignes ---------------------------- */

const KINDS: LineKind[] = [
  "material",
  "labor",
  "travel",
  "rental",
  "service",
  "other",
];

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toLine(raw: Record<string, unknown>, vatLiable: boolean): QuoteLine {
  const kind = (raw.kind as LineKind) ?? "material";
  const vat = vatLiable
    ? [20, 10, 5.5].includes(num(raw.taux_tva ?? raw.vat))
      ? num(raw.taux_tva ?? raw.vat)
      : 10
    : 0; // franchise : pas de TVA
  return {
    id: newId(),
    kind: KINDS.includes(kind) ? kind : "material",
    designation: String(raw.description ?? raw.designation ?? "").slice(0, 200),
    description: "",
    qty: num(raw.quantite ?? raw.qty, 1),
    unit: String(raw.unite ?? raw.unit ?? "u").slice(0, 12),
    unitPrice: num(raw.prix_unitaire_ht ?? raw.unitPrice),
    purchasePrice: num(raw.prix_achat_ht ?? raw.purchasePrice),
    vat,
  };
}

/* ----------------------------- Prompt système ---------------------------- */

function questionsBlock(questions: TradeQuestion[]): string {
  return questions
    .map(
      (q, i) =>
        `${i + 1}. [${q.key}] ${q.question}` +
        (q.hint ? ` (aide : ${q.hint})` : "") +
        (q.chips.length ? `\n   chips: ${JSON.stringify(q.chips)}` : "")
    )
    .join("\n");
}

function buildSystem(
  profile: Profile,
  products: unknown[],
  questions: TradeQuestion[]
): string {
  const tva = profile.vatLiable
    ? `Assujetti — taux ${profile.vatRate ?? 20}%`
    : "Franchise art. 293B (TVA non applicable)";

  return `Tu es l'assistant devis de Shift Office, outil pour artisans du bâtiment français.

CONTEXTE ARTISAN :
- Entreprise : ${profile.name || "—"}
- Métier : ${profile.trade || "—"}
- Régime : ${profile.fiscalRegime || "micro"}
- TVA : ${tva}
- Catalogue (${(products as unknown[]).length} produits) : ${JSON.stringify(products).slice(0, 4000)}

QUESTIONS À POSER, DANS L'ORDRE (une par message) :
${questionsBlock(questions)}

RÈGLES STRICTES :
1. Pose UNE seule question à la fois, dans l'ordre ci-dessus.
2. Vouvoiement obligatoire, ton professionnel et bienveillant, phrases courtes.
3. Si une information est DÉJÀ donnée dans les messages, ne la redemande pas : passe à la suivante.
4. N'invente jamais de prix : utilise le catalogue, sinon des fourchettes standard du marché français BTP.
5. Ne génère le devis (complete=true) qu'APRÈS avoir toutes les informations.
6. ${
    profile.vatLiable
      ? `Assujetti TVA : applique le taux ${profile.vatRate ?? 20}% (ou 10% en rénovation de logement de +2 ans).`
      : `Franchise TVA : taux_tva = 0 sur toutes les lignes, mention "TVA non applicable - art. 293B du CGI".`
  }
7. Réponds TOUJOURS et UNIQUEMENT en JSON valide, sans texte autour :
{
  "message": "texte affiché à l'artisan",
  "etape": N,
  "complete": false,
  "chips": ["proposition 1", "proposition 2"]
}
- "chips" = propositions de réponse rapide pour la question courante (tableau vide si saisie libre attendue).
8. Quand toutes les infos sont réunies, réponds avec "complete": true et ajoute "devis_data" :
{
  "objet": "intitulé du devis",
  "client_nom": "...",
  "client_ville": "...",
  "lignes": [
    { "description": "...", "quantite": N, "unite": "m²|h|u|forfait", "prix_unitaire_ht": N, "prix_achat_ht": N, "taux_tva": N, "kind": "material|labor|travel|rental|service|other" }
  ]
}
Dans ce cas, "message" = un court récapitulatif (1-2 phrases) du devis, PUIS une invitation professionnelle à compléter avant finalisation. Exemple : « Votre devis est prêt. Souhaitez-vous ajouter une prestation, ajuster une quantité ou un prix avant de le finaliser ? »
9. Le devis peut être MODIFIÉ après génération : si l'artisan demande un ajout ou un ajustement, renvoie à nouveau "complete": true avec le "devis_data" mis à jour (lignes complètes), et reformule l'invitation à compléter.`;
}

/* -------------------------- Extraction du JSON --------------------------- */

type Parsed = {
  message: string;
  etape?: number;
  complete?: boolean;
  chips?: string[];
  devis_data?: {
    objet?: string;
    client_nom?: string;
    client_ville?: string;
    lignes?: Record<string, unknown>[];
  };
};

function extractJson(text: string): Parsed | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Parsed;
  } catch {
    return null;
  }
}

/* -------------------------------- Route ---------------------------------- */

export async function POST(req: Request) {
  let body: {
    messages?: InMsg[];
    profile?: Profile;
    products?: unknown[];
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const messages = (body.messages ?? []).filter(
    (m) =>
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim()
  );
  if (messages.length === 0) {
    return Response.json({ error: "Aucun message." }, { status: 400 });
  }

  const profile = body.profile ?? {};
  const products = body.products ?? [];
  const tradeKey = detectTradeKey(profile.trade);
  const questions = QUESTIONS_METIER[tradeKey];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Repli sans clé : on guide quand même avec la première question.
    const first = questions[0];
    return Response.json({
      message:
        "Le moteur IA n'est pas encore activé sur ce serveur (clé ANTHROPIC_API_KEY manquante). " +
        "Pour commencer : " +
        first.question,
      complete: false,
      chips: first.chips,
    });
  }

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: buildSystem(profile, products, questions),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    const parsed = extractJson(text);
    if (!parsed) {
      return Response.json({
        message: text || "Pouvez-vous préciser votre demande ?",
        complete: false,
        chips: [],
      });
    }

    // Devis prêt → on mappe les lignes vers le format interne.
    if (parsed.complete && parsed.devis_data) {
      const d = parsed.devis_data;
      const lines = (d.lignes ?? []).map((l) => toLine(l, !!profile.vatLiable));
      const ville = d.client_ville ? d.client_ville : "";
      return Response.json({
        message: parsed.message || "Votre devis est prêt.",
        complete: true,
        chips: [],
        devis: {
          title: d.objet ?? "",
          clientName: d.client_nom ?? "",
          clientAddress: ville,
          lines,
        },
      });
    }

    return Response.json({
      message: parsed.message || "…",
      complete: false,
      chips: Array.isArray(parsed.chips) ? parsed.chips.slice(0, 6) : [],
    });
  } catch (err) {
    const msg =
      err instanceof Anthropic.APIError
        ? `Erreur du moteur IA (${err.status}). Réessayez.`
        : "Une erreur est survenue. Réessayez.";
    return Response.json({ message: msg, complete: false, chips: [] });
  }
}
