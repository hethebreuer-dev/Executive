import type { Metadata } from "next";
import { Archivo } from "next/font/google";

// Bold grotesk for display — uppercase headlines, tight tracking, generous
// scale. Body stays on Geist (global). Both load self-hosted at build time.
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

// Hidden pitch page: a URL to send by email, kept out of search and the site's
// own navigation. Nothing links here.
export const metadata: Metadata = {
  title: "Anduril Soft Goods — A Concept",
  description:
    "A soft-goods concept for Anduril: two capsule collections, one brand system. Concept, not affiliated with Anduril Industries.",
  robots: { index: false, follow: false },
};

export default function AndurilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={archivo.variable}>{children}</div>;
}
