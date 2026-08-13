import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/components/luft/AuthProvider";
import { Header } from "@/components/luft/Header";

// Self-hosted (variable) fonts. Previously next/font/google fetched these from
// Google's CDN at build time, which intermittently 404'd on Vercel (stale font
// URLs in the restored build cache) and failed the whole build. Bundling the
// woff2s removes that build-time network dependency entirely.
const oswald = localFont({
  src: "./fonts/oswald.woff2",
  variable: "--font-oswald",
  weight: "200 700",
  display: "swap",
});

const libreFranklin = localFont({
  src: "./fonts/libre-franklin.woff2",
  variable: "--font-libre-franklin",
  weight: "100 900",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "./fonts/jetbrains-mono.woff2",
  variable: "--font-jetbrains-mono",
  weight: "100 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LUFT — Buy. Sell. Breathe air-cooled.",
  description:
    "The marketplace and workshop for air-cooled Porsche 911s. Every air-cooled 911, 912, and 930 for sale in America — priced against real sold comps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${oswald.variable} ${libreFranklin.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
