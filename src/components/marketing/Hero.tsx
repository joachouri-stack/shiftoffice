import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";

export function Hero() {
  return (
    <section className="bg-glow relative overflow-hidden">
      <div className="bg-grid absolute inset-0 -z-10 opacity-60" />
      <Container className="pt-16 pb-20 text-center sm:pt-24 lg:pt-28">
        <div className="animate-in flex justify-center">
          <Badge variant="outline">
            <Sparkles size={13} className="text-brand" />
            Propulsé par l&apos;intelligence artificielle
          </Badge>
        </div>

        <h1 className="animate-in text-ink mx-auto mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
          L&apos;IA qui travaille pour{" "}
          <span className="text-brand">votre entreprise</span>.
        </h1>

        <p className="animate-in text-muted mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty sm:text-xl">
          Shift Office fait gagner plusieurs heures par semaine aux artisans du
          bâtiment. Vos documents, devis et factures — gérés intelligemment,
          sans effort.
        </p>

        <div className="animate-in mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href="/inscription" size="lg" className="w-full sm:w-auto">
            Essayer gratuitement
            <ArrowRight size={18} />
          </Button>
          <Button
            href="/#fonctionnalites"
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            Découvrir Shift Office
          </Button>
        </div>

        <p className="text-muted mt-5 text-sm">
          Sans engagement · Sans carte bancaire · Conçu pour les artisans
        </p>

        {/* Aperçu produit */}
        <div className="animate-in mx-auto mt-16 max-w-5xl">
          <div className="border-line bg-paper rounded-[1.75rem] border p-2 shadow-[var(--shadow-pop)]">
            <div className="bg-mist border-line overflow-hidden rounded-[1.4rem] border">
              <AppPreview />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Aperçu stylisé de l'application (mockup léger, sans assets externes). */
function AppPreview() {
  return (
    <div className="flex min-h-[280px] flex-col text-left sm:min-h-[420px]">
      {/* Barre fenêtre */}
      <div className="border-line flex items-center gap-2 border-b px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400/70" />
        <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
        <span className="h-3 w-3 rounded-full bg-green-400/70" />
        <span className="text-muted ml-3 text-xs">app.shiftoffice.app</span>
      </div>

      <div className="grid flex-1 grid-cols-12">
        {/* Mini sidebar */}
        <div className="border-line col-span-3 hidden border-r p-4 sm:block">
          <div className="bg-brand/15 h-6 w-24 rounded-md" />
          <div className="mt-6 space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="bg-line h-4 w-4 rounded" />
                <div
                  className="bg-line h-3 rounded"
                  style={{ width: `${70 - i * 6}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div className="col-span-12 p-5 sm:col-span-9 sm:p-6">
          <div className="bg-ink/5 h-5 w-40 rounded-md" />
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="border-line bg-paper rounded-xl border p-4 shadow-[var(--shadow-soft)]"
              >
                <div className="bg-brand/20 h-3 w-10 rounded" />
                <div className="bg-ink/10 mt-3 h-6 w-16 rounded" />
              </div>
            ))}
          </div>
          <div className="border-line bg-paper mt-3 rounded-xl border p-4 shadow-[var(--shadow-soft)]">
            <div className="bg-ink/10 h-3 w-32 rounded" />
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div
                    className="bg-line h-3 rounded"
                    style={{ width: `${50 - i * 8}%` }}
                  />
                  <div className="bg-brand/20 h-3 w-12 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
