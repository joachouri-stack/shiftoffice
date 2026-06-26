import { Section, SectionHeading } from "@/components/ui/Section";
import { PricingPlans } from "./PricingPlans";

export function Pricing() {
  return (
    <Section id="abonnements" className="bg-mist/60">
      <SectionHeading
        eyebrow="Abonnements"
        title="Un prix simple, comme le reste"
        subtitle="Commencez gratuitement, évoluez quand vous voulez. Sans engagement."
      />
      <div className="mt-12">
        <PricingPlans variant="marketing" />
      </div>
    </Section>
  );
}
