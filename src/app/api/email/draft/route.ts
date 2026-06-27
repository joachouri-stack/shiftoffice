import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-opus-4-8";

type Body = {
  kind?: "devis" | "facture" | "relance";
  documentRef?: string;
  clientName?: string;
  companyName?: string;
  senderName?: string;
  totalTTC?: string;
  title?: string;
};

const LABEL: Record<string, string> = {
  devis: "devis",
  facture: "facture",
  relance: "relance de paiement",
};

/** Gabarit de repli (sans clé IA) — toujours exploitable. */
function fallback(b: Body): { subject: string; body: string } {
  const kind = b.kind ?? "devis";
  const ref = b.documentRef || "";
  const client = b.clientName || "Madame, Monsieur";
  const company = b.companyName || b.senderName || "Votre artisan";
  const docFr = LABEL[kind] ?? "document";

  const subject =
    kind === "relance"
      ? `Relance — ${docFr} ${ref}`.trim()
      : `${docFr.charAt(0).toUpperCase() + docFr.slice(1)} ${ref}${
          b.title ? ` — ${b.title}` : ""
        }`.trim();

  const intro =
    kind === "facture"
      ? `Veuillez trouver ci-joint votre facture ${ref}${
          b.totalTTC ? ` d'un montant de ${b.totalTTC} € TTC` : ""
        }.`
      : kind === "relance"
        ? `Sauf erreur de notre part, la facture ${ref}${
            b.totalTTC ? ` d'un montant de ${b.totalTTC} € TTC` : ""
          } reste à ce jour impayée. Nous vous remercions de bien vouloir procéder à son règlement.`
        : `Suite à notre échange, veuillez trouver ci-joint votre devis ${ref}${
            b.totalTTC ? ` d'un montant de ${b.totalTTC} € TTC` : ""
          }. Je reste à votre disposition pour toute question.`;

  const body = `Bonjour ${client},

${intro}

Je vous en souhaite bonne réception.

Cordialement,
${company}`;

  return { subject, body };
}

export async function POST(req: Request) {
  let b: Body;
  try {
    b = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Pas de clé : on renvoie un gabarit propre, utilisable tel quel.
    return Response.json(fallback(b));
  }

  const kind = b.kind ?? "devis";
  const docFr = LABEL[kind] ?? "document";

  const system = `Tu rédiges des emails professionnels et chaleureux pour un artisan du bâtiment français qui envoie ses documents à ses clients.
RÈGLES :
- Réponds UNIQUEMENT avec un objet JSON {"subject": "...", "body": "..."} et rien d'autre.
- Français impeccable, ton professionnel et courtois, jamais familier.
- Court : 4 à 7 lignes de corps. Le PDF est joint à l'email, n'en recopie pas le détail.
- Termine par une formule de politesse et la signature avec le nom de l'entreprise.
- N'invente aucun montant ni information non fournie.`;

  const ctx = `Type d'email : ${docFr}
Référence du document : ${b.documentRef || "(non numéroté)"}
Objet des travaux : ${b.title || "—"}
Montant TTC : ${b.totalTTC ? `${b.totalTTC} €` : "—"}
Client : ${b.clientName || "—"}
Entreprise expéditrice : ${b.companyName || b.senderName || "—"}`;

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system,
      messages: [{ role: "user", content: ctx }],
    });
    const text = res.content
      .filter((blk): blk is Anthropic.TextBlock => blk.type === "text")
      .map((blk) => blk.text)
      .join("")
      .trim();

    // Extrait le bloc JSON (l'IA peut l'entourer de texte malgré la consigne).
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as {
        subject?: string;
        body?: string;
      };
      if (parsed.subject && parsed.body) {
        return Response.json({ subject: parsed.subject, body: parsed.body });
      }
    }
    return Response.json(fallback(b));
  } catch {
    return Response.json(fallback(b));
  }
}
