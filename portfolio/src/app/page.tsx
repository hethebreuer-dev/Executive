import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { WorkGrid } from "@/components/WorkGrid";
import { ContactFooter } from "@/components/ContactFooter";
import { VenturesGrid } from "@/components/Ventures";
import { projectsInOrder } from "@/data/projects";
import { ventures } from "@/data/ventures";
import { clients, site } from "@/data/site";
import { IMG } from "@/data/media";

// Homepage hero.
const heroImage: { src: string; alt: string } | undefined = {
  src: IMG.hero.src,
  alt: "Sketching a fashion croquis at the drafting table",
};

const pillBase: React.CSSProperties = {
  padding: "14px 26px",
  borderRadius: 999,
  fontSize: 15,
  minHeight: 44,
  display: "inline-flex",
  alignItems: "center",
};

function Hero() {
  return (
    <section className="hero">
      {heroImage ? (
        <Image
          src={heroImage.src}
          alt={heroImage.alt}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "var(--bg-placeholder)",
              backgroundImage: "var(--stripe)",
            }}
          />
          <div
            className="font-mono"
            style={{
              position: "absolute",
              top: 20,
              right: 24,
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "var(--text-slot)",
            }}
          >
            HERO IMAGE — 2880×1200 — strongest campaign shot
          </div>
        </>
      )}

      <div className="hero-overlay">
        <h1
          style={{
            maxWidth: 900,
            fontSize: "clamp(30px, 6vw, 60px)",
            lineHeight: 1.06,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            textWrap: "pretty",
            margin: 0,
          }}
        >
          Design director. Twenty years of product that moved on the floor.
        </h1>
        <p
          className="hero-sub"
          style={{
            maxWidth: 660,
            fontSize: "clamp(15px, 2.6vw, 19px)",
            lineHeight: 1.5,
            color: "var(--text-muted)",
          }}
        >
          Men&apos;s and women&apos;s collections for national retail — Ralph
          Lauren, American Eagle, PacSun, Kellwood — and private label for US and
          UK retailers. Teams of six, ten-season brands, 40% category growth.
        </p>
        <div className="hero-cta" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Link
            href="/#work"
            style={{
              ...pillBase,
              background: "var(--text)",
              color: "var(--on-light)",
              fontWeight: 500,
            }}
          >
            View selected work
          </Link>
          <a
            href={site.resumePdf}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...pillBase,
              border: "1px solid var(--border-button)",
            }}
          >
            Download resume (PDF)
          </a>
        </div>
      </div>
    </section>
  );
}

function ClientBand() {
  return (
    <div
      className="font-mono"
      style={{
        display: "flex",
        gap: 56,
        rowGap: 12,
        flexWrap: "wrap",
        padding: "26px var(--gutter)",
        borderTop: "1px solid var(--border-subtle)",
        borderBottom: "1px solid var(--border-subtle)",
        fontSize: 14,
        letterSpacing: "0.1em",
        color: "var(--text-faint)",
      }}
    >
      {clients.map((c) => (
        <span key={c}>{c}</span>
      ))}
    </div>
  );
}

function VenturesSection() {
  return (
    <section
      id="ventures"
      style={{
        background: "var(--bg-raised)",
        padding: "64px var(--gutter)",
        scrollMarginTop: "var(--header-h)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
          marginBottom: 34,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 34,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            Ventures
          </h2>
          <p style={{ marginTop: 10, fontSize: 16, color: "var(--text-dim)" }}>
            Built and run, outside client work.
          </p>
        </div>
        <Link href="/ventures" style={{ fontSize: 14, color: "var(--text-dim)" }}>
          See all →
        </Link>
      </div>
      <VenturesGrid ventures={ventures} />
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Header active="Work" />
      <main>
        <Hero />
        <ClientBand />
        <Suspense fallback={null}>
          <WorkGrid projects={projectsInOrder} />
        </Suspense>
        <VenturesSection />
        <ContactFooter />
      </main>
    </>
  );
}
