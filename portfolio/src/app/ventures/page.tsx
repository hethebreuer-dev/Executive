import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { ContactFooter } from "@/components/ContactFooter";
import { VenturesGrid } from "@/components/Ventures";
import { ventures } from "@/data/ventures";

export const metadata: Metadata = {
  title: "Ventures",
  description:
    "Built and run, outside client work — Worksta.ai, Happie Mushrooms, and the Breuer00 Porsche.",
};

export default function VenturesPage() {
  return (
    <>
      <Header active="Ventures" />
      <main>
        <div style={{ padding: "64px var(--gutter) 20px", maxWidth: 720 }}>
          <h1
            style={{
              fontSize: "clamp(34px, 5vw, 44px)",
              fontWeight: 500,
              letterSpacing: "-0.015em",
              margin: 0,
            }}
          >
            Ventures
          </h1>
          <p
            style={{
              marginTop: 16,
              fontSize: 19,
              lineHeight: 1.55,
              color: "var(--text-muted)",
            }}
          >
            Built and run, outside client work. Non-fashion work kept in its own
            lane — product, packaging, and a personal Porsche build.
          </p>
        </div>
        <div style={{ padding: "28px var(--gutter) 64px" }}>
          <VenturesGrid ventures={ventures} />
        </div>
        <ContactFooter />
      </main>
    </>
  );
}
