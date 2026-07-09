import { getAnthropic, isAIEnabled, AI_MODEL } from "@/lib/ia/anthropic";
import { rateLimitOk, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Assistance IA des statuts : rédige un objet social correct et
 * suffisamment large à partir de la description d'activité de
 * l'utilisateur — sans inventer d'activités sans rapport.
 * No-op si l'IA n'est pas configurée (ANTHROPIC_API_KEY absent).
 */
export async function POST(req: Request) {
  if (!isAIEnabled()) return Response.json({ aiDisabled: true });
  if (!rateLimitOk(`ia-statuts:${clientIp(req)}`, 10, 60_000)) {
    return Response.json(
      { error: "Trop de demandes — patientez une minute." },
      { status: 429 }
    );
  }

  let body: { activite?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const activite = (body.activite ?? "").trim();
  if (activite.length < 5) {
    return Response.json(
      { error: "Décrivez d'abord l'activité en quelques mots." },
      { status: 400 }
    );
  }
  if (activite.length > 500) {
    return Response.json(
      { error: "La description est trop longue (500 caractères maximum)." },
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
        `Tu rédiges l'objet social des statuts d'une société française à partir de la ` +
        `description d'activité fournie par le fondateur.\n` +
        `RÈGLES IMPÉRATIVES :\n` +
        `- Pars UNIQUEMENT de l'activité décrite : n'invente pas d'activités sans rapport.\n` +
        `- Formule LARGE, comme le font les juristes : élargis l'activité décrite à sa famille ` +
        `naturelle (ex. « conseil en paie » → « le conseil, la formation et l'assistance aux ` +
        `entreprises en matière sociale, de paie et de ressources humaines »), pour éviter au ` +
        `fondateur de devoir modifier ses statuts à chaque évolution.\n` +
        `- Termine par la clause d'usage : « et, plus généralement, toutes opérations ` +
        `industrielles, commerciales, financières, civiles, mobilières ou immobilières ` +
        `se rattachant directement ou indirectement à cet objet ou susceptibles d'en ` +
        `faciliter la réalisation ou le développement ».\n` +
        `- Une seule phrase ou un court paragraphe (2-3 phrases maximum), en français ` +
        `juridique sobre, sans liste à puces, sans guillemets.\n` +
        `- N'inclus PAS d'activités réglementées (banque, assurance, santé, expertise ` +
        `comptable, droit) sauf si elles sont explicitement décrites.`,
      tools: [
        {
          name: "resultat_objet",
          description: "Renvoie l'objet social rédigé.",
          input_schema: {
            type: "object",
            properties: {
              objet: {
                type: "string",
                description: "L'objet social rédigé, prêt à insérer dans les statuts.",
              },
            },
            required: ["objet"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "resultat_objet" },
      messages: [
        {
          role: "user",
          content: `Activité décrite par le fondateur :\n${activite}`,
        },
      ],
    });

    const block = msg.content.find((b) => b.type === "tool_use");
    const out =
      block && block.type === "tool_use" ? (block.input as { objet?: string }) : {};
    const objet = String(out.objet ?? "").trim();
    if (!objet) {
      return Response.json({ error: "La rédaction a échoué. Réessayez." }, { status: 502 });
    }
    return Response.json({ objet });
  } catch (err) {
    console.error("IA statuts error", err);
    return Response.json(
      { error: "L'assistance IA a échoué. Réessayez dans un instant." },
      { status: 502 }
    );
  }
}
