import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";
import { PricingPlans } from "@/components/marketing/PricingPlans";

export const metadata: Metadata = { title: "Abonnement" };

export default function AbonnementPage() {
  return (
    <>
      <PageHeader
        title="Abonnement"
        subtitle="Choisissez la formule qui vous correspond. Sans engagement."
      />
      <PricingPlans variant="app" current="gratuit" />
    </>
  );
}
