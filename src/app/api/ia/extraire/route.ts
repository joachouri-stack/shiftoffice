import { getAnthropic, isAIEnabled, AI_MODEL } from "@/lib/ia/anthropic";
import { CHAMPS } from "@/lib/ia/champs";
import { titleForSlug } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * « Mode rapide » : extrait les champs d'un document à partir d'une
 * description en langage naturel, via l'API Claude (tool-use forcé pour une
 * sortie structurée). No-op si l'IA n'est pas configurée.
 */
export async function POST(req: Request) {
  if (!isAIEnabled()) {
    return Response.json({ aiDisabled: true });
  }

  let body: { type?: string; texte?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const type = body.type ?? "";
  const texte = (body.texte ?? "").trim();
  const champs = CHAMPS[type];

  if (!champs) {
    return Response.json({ error: "Type inconnu." }, { status: 400 });
  }
  if (!texte) {
    return Response.json({ error: "Description vide." }, { status: 400 });
  }

  const properties: Record<string, { type: "string"; description: string }> =
    {};
  for (const c of champs) {
    properties[c.key] = { type: "string", description: c.desc };
  }

  const anthropic = getAnthropic();
  if (!anthropic) return Response.json({ aiDisabled: true });

  try {
    const msg = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      system:
        `Tu es un assistant qui extrait des informations d'une description en ` +
        `langage naturel pour pré-remplir un document « ${titleForSlug(type)} ». ` +
        `Renseigne uniquement les champs que tu peux déduire du texte ; laisse ` +
        `vide (chaîne vide) tout champ absent ou incertain. N'invente rien. ` +
        `Formate les dates en JJ/MM/AAAA et les montants en chiffres sans symbole.`,
      tools: [
        {
          name: "remplir_document",
          description:
            "Renvoie les champs extraits de la description pour pré-remplir le formulaire.",
          input_schema: {
            type: "object",
            properties,
            required: [],
          },
        },
      ],
      tool_choice: { type: "tool", name: "remplir_document" },
      messages: [{ role: "user", content: texte }],
    });

    const block = msg.content.find((b) => b.type === "tool_use");
    const valeurs =
      block && block.type === "tool_use"
        ? (block.input as Record<string, unknown>)
        : {};

    // Ne garder que les valeurs non vides, converties en chaînes.
    const out: Record<string, string> = {};
    for (const c of champs) {
      const v = valeurs[c.key];
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        out[c.key] = String(v).trim();
      }
    }

    return Response.json({ valeurs: out });
  } catch (err) {
    console.error("IA extraire error", err);
    return Response.json(
      { error: "L'extraction a échoué. Réessayez ou remplissez à la main." },
      { status: 502 }
    );
  }
}
