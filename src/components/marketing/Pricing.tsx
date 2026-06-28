import { Container } from "@/components/ui/Container";
import { PricingPlans } from "./PricingPlans";

export function Pricing() {
  return (
    <section id="abonnements" className="bg-ink relative overflow-hidden py-14 sm:py-18 lg:py-24">
      {/* Halo orange */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px]"
        style={{
          background:
            "radial-gradient(50% 100% at 50% 0%, rgba(255,107,43,0.20) 0%, transparent 70%)",
        }}
      />
      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-brand mb-3 text-sm font-semibold tracking-tight">
            Abonnements
          </p>
          <h2 className="text-paper text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Lancez-vous dès aujourd&apos;hui
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/65 text-pretty">
            Votre premier devis en quelques minutes. Commencez gratuitement,
            évoluez quand vous voulez — sans engagement.
          </p>
        </div>
        <div className="mt-12">
          <PricingPlans variant="marketing" surface="dark" />
        </div>
      </Container>
    </section>
  );
}
