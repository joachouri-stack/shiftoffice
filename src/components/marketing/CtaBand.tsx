import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export function CtaBand() {
  return (
    <section className="pb-20 sm:pb-28">
      <Container>
        <div className="bg-ink relative overflow-hidden rounded-[2.25rem] px-6 py-16 text-center sm:px-12 sm:py-20">
          {/* Glow orange */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-0"
            style={{
              background:
                "radial-gradient(50% 60% at 50% 0%, rgba(255,107,43,0.28) 0%, transparent 70%)",
            }}
          />
          <div className="relative">
            <h2 className="text-paper mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              Reprenez le contrôle de votre temps.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">
              Rejoignez les artisans qui laissent l&apos;IA s&apos;occuper de la
              paperasse. Essai gratuit, sans carte bancaire.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                href="/inscription"
                size="lg"
                className="w-full sm:w-auto"
              >
                Essayer gratuitement
                <ArrowRight size={18} />
              </Button>
              <Button
                href="/connexion"
                variant="secondary"
                size="lg"
                className="w-full bg-white/10 text-paper hover:bg-white/20 sm:w-auto"
              >
                J&apos;ai déjà un compte
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
