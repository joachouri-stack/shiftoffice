import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { Stats } from "@/components/marketing/Stats";
import { Produits } from "@/components/marketing/Produits";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Produits />
      </main>
    </>
  );
}
