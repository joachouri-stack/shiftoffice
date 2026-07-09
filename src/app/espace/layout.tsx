import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mon espace",
  robots: { index: false },
};

export default function EspaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
