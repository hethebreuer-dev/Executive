import type { Metadata } from "next";
import { Oswald, Libre_Franklin, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/luft/AuthProvider";
import { Header } from "@/components/luft/Header";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const libreFranklin = Libre_Franklin({
  variable: "--font-libre-franklin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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
