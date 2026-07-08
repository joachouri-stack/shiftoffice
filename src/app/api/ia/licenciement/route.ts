import { getAnthropic, isAIEnabled, AI_MODEL } from "@/lib/ia/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  "cause-reelle": "licenciement pour cause réelle et sérieuse",
  "faute-grave": "licenciement pour faute grave",
  "faute-lourde": "licenciement pour faute lourde",
  economique: "licenciement pour motif économique",
};

/**
 * Assistance IA de la lettre de licenciement :
 * 1) reformule les faits saisis en un exposé des motifs précis, daté et
 *    objectif — sans jamais inventer un fait, une date ou une accusation ;
 * 2) contrôle la cohérence entre les faits décrits et le type de
 *    licenciement choisi, et suggère le type adapté en cas d'écart.
 * No-op si l'IA n'est pas configurée (ANTHROPIC_API_KEY absent).
 */
export async function POST(req: Request) {
  if (!isAIEnabled()) return Response.json({ aiDisabled: true });

  let body: { motifs?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const motifs = (body.motifs ?? "").trim();
  const typeKey = body.type ?? "";
  const typeLibelle = TYPES[typeKey];
  if (!typeLibelle) {
    return Response.json({ error: "Type de licenciement inconnu." }, { status: 400 });
  }
  if (motifs.length < 15) {
    return Response.json(
      { error: "Décrivez d'abord les faits en quelques phrases." },
      { status: 400 }
    );
  }

  const anthropic = getAnthropic();
  if (!anthropic) return Response.json({ aiDisabled: true });

  try {
    const msg = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      system:
        `Tu assistes un employeur français qui rédige l'exposé des motifs d'une lettre de ` +
        `${typeLibelle}. À partir des faits bruts fournis, rédige un exposé des motifs ` +
        `professionnel : phrases complètes, ton factuel et objectif, faits datés et précis, ` +
        `sans jugement de valeur ni qualification pénale.\n` +
        `RÈGLES IMPÉRATIVES :\n` +
        `- N'invente AUCUN fait, AUCUNE date, AUCUN chiffre : utilise exclusivement ce qui est fourni.\n` +
        `- N'ajoute aucune accusation ni aggravation ; ne minimise pas non plus.\n` +
        `- Conserve les dates au format JJ/MM/AAAA ou tel que fourni.\n` +
        `- 3 à 8 phrases maximum, à la première personne du pluriel (« Nous avons constaté… »).\n` +
        `- Pas d'en-tête, pas de formule de politesse : uniquement l'exposé des faits.\n` +
        `Évalue ensuite la cohérence juridique : les faits décrits correspondent-ils au type ` +
        `« ${typeLibelle} » ? Rappels : la faute grave rend impossible le maintien dans ` +
        `l'entreprise (abandon de poste, vol, insubordination caractérisée…) ; la faute lourde ` +
        `exige une intention de nuire à l'employeur ; l'insuffisance professionnelle ou des ` +
        `faits isolés de faible gravité relèvent de la cause réelle et sérieuse ; le motif ` +
        `économique concerne les difficultés économiques ou mutations, pas le comportement.`,
      tools: [
        {
          name: "resultat_motifs",
          description: "Renvoie l'exposé des motifs reformulé et l'analyse de cohérence.",
          input_schema: {
            type: "object",
            properties: {
              texte: {
                type: "string",
                description: "L'exposé des motifs reformulé, prêt à insérer dans la lettre.",
              },
              coherent: {
                type: "boolean",
                description: "true si les faits décrits correspondent au type de licenciement choisi.",
              },
              alerte: {
                type: "string",
                description:
                  "Si incohérent : explication courte (1-2 phrases) du problème, en français. Sinon chaîne vide.",
              },
              type_suggere: {
                type: "string",
                enum: ["cause-reelle", "faute-grave", "faute-lourde", "economique", ""],
                description: "Si incohérent : le type de licenciement le plus adapté aux faits. Sinon chaîne vide.",
              },
            },
            required: ["texte", "coherent"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "resultat_motifs" },
      messages: [
        {
          role: "user",
          content: `Type choisi : ${typeLibelle}.\nFaits bruts décrits par l'employeur :\n${motifs}`,
        },
      ],
    });

    const block = msg.content.find((b) => b.type === "tool_use");
    const out =
      block && block.type === "tool_use"
        ? (block.input as {
            texte?: string;
            coherent?: boolean;
            alerte?: string;
            type_suggere?: string;
          })
        : {};

    const texte = String(out.texte ?? "").trim();
    if (!texte) {
      return Response.json(
        { error: "La reformulation a échoué. Réessayez." },
        { status: 502 }
      );
    }

    return Response.json({
      texte,
      coherent: out.coherent !== false,
      alerte: String(out.alerte ?? "").trim(),
      typeSuggere:
        out.type_suggere && TYPES[out.type_suggere] && out.type_suggere !== typeKey
          ? out.type_suggere
          : "",
    });
  } catch (err) {
    console.error("IA licenciement error", err);
    return Response.json(
      { error: "L'assistance IA a échoué. Réessayez dans un instant." },
      { status: 502 }
    );
  }
}
