import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { Produits } from "@/components/marketing/Produits";
import { Etapes } from "@/components/marketing/Etapes";
import { Avis } from "@/components/marketing/Avis";
import { Faq } from "@/components/marketing/Faq";
import { FAQ } from "@/components/marketing/faq-data";
import { CtaFinal } from "@/components/marketing/CtaFinal";
import { Footer } from "@/components/marketing/Footer";
import { DOCUMENTS, flowHref } from "@/lib/documents";

/** Données structurées (rich results Google) : FAQ + catalogue de documents. */
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    ...DOCUMENTS.map((d) => ({
      "@type": "Product",
      name: d.title,
      description: d.desc,
      url: `https://shiftoffice.fr${flowHref(d.slug)}`,
      offers: {
        "@type": "Offer",
        price: d.price.toFixed(2),
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
      },
    })),
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <Navbar />
      <main>
        <Hero />
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
