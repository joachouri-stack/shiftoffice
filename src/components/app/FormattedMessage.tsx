import { Fragment } from "react";

/** Rend du **gras** dans une ligne de texte (sans HTML brut). */
function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={i}>{p}</Fragment>;
  });
}

const BULLET = /^\s*[-•*]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;

/**
 * Rendu léger et sûr des réponses de l'IA : gras, listes à puces, listes
 * numérotées, paragraphes. Produit uniquement des éléments React.
 */
export function FormattedMessage({ content }: { content: string }) {
  const lines = content.replace(/\r/g, "").split("\n");
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (!list) return;
    const items = list.items;
    blocks.push(
      list.ordered ? (
        <ol
          key={blocks.length}
          className="list-decimal space-y-1 pl-5 marker:text-muted"
        >
          {items.map((it, i) => (
            <li key={i}>{inline(it)}</li>
          ))}
        </ol>
      ) : (
        <ul
          key={blocks.length}
          className="space-y-1 pl-1"
        >
          {items.map((it, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-brand mt-[0.45em] inline-block h-1 w-1 shrink-0 rounded-full bg-current" />
              <span>{inline(it)}</span>
            </li>
          ))}
        </ul>
      )
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (BULLET.test(line)) {
      if (!list || list.ordered) {
        flush();
        list = { ordered: false, items: [] };
      }
      list.items.push(line.replace(BULLET, ""));
    } else if (NUMBERED.test(line)) {
      if (!list || !list.ordered) {
        flush();
        list = { ordered: true, items: [] };
      }
      list.items.push(line.replace(NUMBERED, ""));
    } else if (line.trim() === "") {
      flush();
    } else {
      flush();
      blocks.push(<p key={blocks.length}>{inline(line)}</p>);
    }
  }
  flush();

  return <div className="space-y-2">{blocks}</div>;
}
