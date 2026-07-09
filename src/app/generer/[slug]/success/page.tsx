"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Download, Loader2, XCircle } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { EmailCopy } from "@/components/documents/EmailCopy";
import { DOCUMENTS } from "@/lib/documents";
import { localStore, type LocalFiche, type LocalDoc } from "@/lib/local/store";

type Pending = {
  type: string;
  donnees: Record<string, unknown>;
  filename: string;
  ficheMeta?: Omit<LocalFiche, "id">;
  docMeta?: Omit<LocalDoc, "id">;
};

type Status = "loading" | "done" | "error";

function SuccessInner() {
  const params = useParams<{ slug: string }>();
  const search = useSearchParams();
  const sessionId = search.get("session_id") ?? "";
  const doc = DOCUMENTS.find((d) => d.slug === params.slug);

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const pendingRef = useRef<Pending | null>(null);
  const started = useRef(false);

  async function run() {
    const key = `shiftoffice:pending:${params.slug}`;
    const raw =
      typeof window !== "undefined" ? sessionStorage.getItem(key) : null;
    if (!raw) {
      setStatus("error");
      setMessage(
        "Les informations du document ne sont plus disponibles (session expirée). Reprenez le formulaire."
      );
      return;
    }
    let pending: Pending;
    try {
      pending = JSON.parse(raw) as Pending;
    } catch {
      setStatus("error");
      setMessage("Données du document illisibles. Reprenez le formulaire.");
      return;
    }
    pendingRef.current = pending;

    try {
      const res = await fetch("/api/documents/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type_document: pending.type,
          donnees: pending.donnees,
          session_id: sessionId,
        }),
      });
      if (!res.ok) {
        setStatus("error");
        setMessage(
          res.status === 402
            ? "Le paiement n'a pas pu être confirmé. Si vous avez été débité, contactez-nous."
            : "La génération a échoué. Réessayez le téléchargement."
        );
        return;
      }
      triggerDownload(await res.blob(), pending.filename);
      // Fiche de paie : on enregistre dans l'espace local (historique + reprise).
      if (pending.ficheMeta) {
        try {
          localStore.addFiche(pending.ficheMeta);
        } catch {
          /* historique best-effort */
        }
      }
      if (pending.docMeta) {
        try {
          localStore.addDocument(pending.docMeta);
        } catch {
          /* historique best-effort */
        }
      }
      sessionStorage.removeItem(key);
      setStatus("done");
    } catch {
      setStatus("error");
      setMessage("Une erreur réseau est survenue. Réessayez le téléchargement.");
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function retry() {
    const pending = pendingRef.current;
    if (!pending) return;
    triggerDownloadFromApi(pending, sessionId, setStatus, setMessage, params.slug);
  }

  return (
    <div className="bg-creme min-h-dvh">
      <header className="bg-noir">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo theme="dark" />
          <Link
            href="/#produits"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft size={16} />
            Tous les documents
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className="border-or/20 rounded-2xl border bg-white p-8 text-center shadow-sm">
          {status === "loading" && (
            <>
              <Loader2 size={40} className="text-or mx-auto animate-spin" />
              <h1 className="font-display text-noir mt-5 text-2xl font-extrabold">
                Paiement confirmé
              </h1>
              <p className="text-gris mt-2 text-sm">
                Nous générons votre {doc?.title ?? "document"}…
              </p>
            </>
          )}

          {status === "done" && (
            <>
              <CheckCircle2 size={44} className="text-vert mx-auto" />
              <h1 className="font-display text-noir mt-5 text-2xl font-extrabold">
                C&apos;est prêt !
              </h1>
              <p className="text-gris mt-2 text-sm">
                Votre {doc?.title ?? "document"} a été téléchargé. Le téléchargement
                ne démarre pas&nbsp;?
              </p>
              <button
                onClick={retry}
                className="bg-orange hover:bg-orange-d mt-5 inline-flex items-center justify-center gap-2 rounded-[10px] px-6 py-3 text-sm font-bold text-white transition-colors"
              >
                <Download size={16} />
                Télécharger à nouveau
              </button>
              {pendingRef.current && (
                <div className="mx-auto mt-2 max-w-sm text-left">
                  <EmailCopy
                    type={pendingRef.current.type}
                    donnees={pendingRef.current.donnees}
                    sessionId={sessionId}
                  />
                </div>
              )}
              <p className="text-gris mt-4 text-xs">
                Retrouvez-le dans{" "}
                <Link href="/espace" className="text-or-d font-semibold underline">
                  Mon espace
                </Link>
                .
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle size={44} className="mx-auto text-red-500" />
              <h1 className="font-display text-noir mt-5 text-2xl font-extrabold">
                Un souci est survenu
              </h1>
              <p className="text-gris mt-2 text-sm">{message}</p>
              <Link
                href={`/generer/${params.slug}`}
                className="bg-noir mt-5 inline-flex items-center justify-center gap-2 rounded-[10px] px-6 py-3 text-sm font-bold text-white transition-colors hover:opacity-90"
              >
                Revenir au formulaire
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function triggerDownloadFromApi(
  pending: Pending,
  sessionId: string,
  setStatus: (s: Status) => void,
  setMessage: (m: string) => void,
  slug: string
) {
  try {
    const res = await fetch("/api/documents/generer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type_document: pending.type,
        donnees: pending.donnees,
        session_id: sessionId,
      }),
    });
    if (!res.ok) {
      setStatus("error");
      setMessage("Le nouveau téléchargement a échoué.");
      return;
    }
    triggerDownload(await res.blob(), pending.filename);
    sessionStorage.removeItem(`shiftoffice:pending:${slug}`);
  } catch {
    setStatus("error");
    setMessage("Une erreur réseau est survenue.");
  }
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-creme grid min-h-dvh place-items-center">
          <Loader2 size={32} className="text-or animate-spin" />
        </div>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}
