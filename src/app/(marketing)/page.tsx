import { Hero } from "@/components/marketing/Hero";
import { WhyShiftOffice } from "@/components/marketing/WhyShiftOffice";
import { Features } from "@/components/marketing/Features";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Pricing } from "@/components/marketing/Pricing";
import { Integrations } from "@/components/marketing/Integrations";
import { Faq } from "@/components/marketing/Faq";
import { CtaBand } from "@/components/marketing/CtaBand";

export default function HomePage() {
  return (
    <>
      <Hero />
      <WhyShiftOffice />
      <Features />
      <HowItWorks />
      <Pricing />
      <Integrations />
      <Faq />
      <CtaBand />
    </>
  );
}
