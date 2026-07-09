import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Votre document est prêt",
  robots: { index: false },
};

export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
