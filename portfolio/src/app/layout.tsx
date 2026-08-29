import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Geist (variable) is the workhorse — weight 500 for every heading, no bold
// anywhere. Geist Mono 400 for labels, years and eyebrows. Both self-hosted
// by next/font at build time (no runtime request to Google).
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hethebreuer.com"),
  title: {
    default: "Hethe Breuer — Design Director",
    template: "%s — Hethe Breuer",
  },
  description:
    "Design director with twenty years of apparel product for national US retail — Ralph Lauren, American Eagle, PacSun, Kellwood — and private label for US and UK retailers.",
  openGraph: {
    title: "Hethe Breuer — Design Director",
    description:
      "Twenty years of product that moved on the floor. Men's and women's collections for national retail, and private label for US and UK retailers.",
    url: "https://hethebreuer.com",
    siteName: "Hethe Breuer",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
