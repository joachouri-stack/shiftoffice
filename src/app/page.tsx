import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { Stats } from "@/components/marketing/Stats";
import { Produits } from "@/components/marketing/Produits";
import { Etapes } from "@/components/marketing/Etapes";
import { Avis } from "@/components/marketing/Avis";
import { Faq } from "@/components/marketing/Faq";
import { CtaFinal } from "@/components/marketing/CtaFinal";
import { Footer } from "@/components/marketing/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Produits />
        <Etapes />
        <Avis />
        <Faq />
        <CtaFinal />
      </main>
      <Footer />
    </>
  );
}
