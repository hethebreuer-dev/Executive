import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectHeader } from "@/components/Header";
import { DetailBody, NextFooter } from "@/components/DetailBody";
import { autoBlocks } from "@/data/gallery";
import { getVenture, nextVenture, ventures } from "@/data/ventures";

export function generateStaticParams() {
  return ventures.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const venture = getVenture(slug);
  if (!venture) return {};
  return { title: venture.name, description: venture.role };
}

export default async function VenturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const venture = getVenture(slug);
  if (!venture) notFound();

  const next = nextVenture(venture.slug);

  return (
    <>
      <ProjectHeader
        backHref="/ventures"
        backLabel="← Ventures"
        nextName={next.name}
        nextHref={`/ventures/${next.slug}`}
      />
      <main>
        <div style={{ padding: "64px var(--gutter) 40px" }}>
          <h1
            style={{
              fontSize: "clamp(34px, 5.5vw, 56px)",
              fontWeight: 500,
              letterSpacing: "-0.022em",
              margin: 0,
            }}
          >
            {venture.name}
          </h1>
          <p
            style={{
              marginTop: 22,
              maxWidth: 720,
              fontSize: 19,
              lineHeight: 1.55,
              color: "var(--text-muted)",
            }}
          >
            {venture.intro}
          </p>
        </div>

        <DetailBody
          rail={[
            { label: "ROLE", value: venture.rail.role },
            { label: "FOCUS", value: venture.rail.focus },
            { label: "YEAR", value: venture.rail.year },
          ]}
          blocks={autoBlocks(venture.slug, venture.name, venture.caption)}
        />

        <NextFooter
          label="NEXT VENTURE"
          name={next.name}
          href={`/ventures/${next.slug}`}
          card={next.media}
        />
      </main>
    </>
  );
}
