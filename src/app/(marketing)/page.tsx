import { Hero } from "@/components/marketing/Hero";
import { Features } from "@/components/marketing/Features";
import { Trades } from "@/components/marketing/Trades";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Pricing } from "@/components/marketing/Pricing";
import { Faq } from "@/components/marketing/Faq";
import { CtaBand } from "@/components/marketing/CtaBand";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <Trades />
      <HowItWorks />
      <Pricing />
      <Faq />
      <CtaBand />
    </>
  );
}
