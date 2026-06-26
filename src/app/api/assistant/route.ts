import Anthropic from "@anthropic-ai/sdk";
import {
  ASSISTANT_MODEL,
  ASSISTANT_SYSTEM_PROMPT,
  type ChatMessage,
} from "@/lib/assistant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

/** Réponse texte simple en flux (pour les cas sans appel API). */
function textStream(message: string) {
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(message));
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
}

export async function POST(req: Request) {
  let messages: ChatMessage[] = [];
  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
  } catch {
    return new Response("Requête invalide.", { status: 400 });
  }

  // Ne garder que des messages valides et non vides.
  const cleaned = messages
    .filter(
      (m): m is ChatMessage =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) }));

  if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== "user") {
    return new Response("Aucun message à traiter.", { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Démo sans clé : message clair, l'UI reste fonctionnelle.
    return textStream(
      "L'assistant IA n'est pas encore activé sur ce serveur. " +
        "Ajoutez votre clé Anthropic (variable d'environnement ANTHROPIC_API_KEY) " +
        "pour discuter avec votre collaborateur IA spécialisé bâtiment."
    );
  }

  const client = new Anthropic({ apiKey });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const run = client.messages.stream({
          model: ASSISTANT_MODEL,
          max_tokens: 2048,
          system: ASSISTANT_SYSTEM_PROMPT,
          messages: cleaned,
        });

        run.on("text", (delta) => {
          controller.enqueue(encoder.encode(delta));
        });

        await run.finalMessage();
        controller.close();
      } catch (err) {
        const msg =
          err instanceof Anthropic.APIError
            ? `Erreur de l'assistant (${err.status}). Réessayez dans un instant.`
            : "Une erreur est survenue. Réessayez dans un instant.";
        controller.enqueue(encoder.encode(msg));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
