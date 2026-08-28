import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectHeader } from "@/components/Header";
import { MediaFrame } from "@/components/MediaFrame";
import { getProject, nextProject, projects } from "@/data/projects";
import type { Block } from "@/data/types";

const WIDE_SIZES = "(max-width: 900px) 100vw, 68vw";
const PAIR_SIZES = "(max-width: 900px) 50vw, 34vw";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: project.name,
    description: project.result,
  };
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        className="font-mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.12em",
          color: "var(--text-fainter)",
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: 7, fontSize: 15, lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  if (block.type === "caption") {
    return (
      <p
        className="font-mono"
        style={{ fontSize: 14, color: "var(--text-faint)", margin: 0 }}
      >
        {block.text}
      </p>
    );
  }
  if (block.type === "pair") {
    return (
      <div className="pair-grid">
        {block.items.map((m, i) => (
          <MediaFrame
            key={i}
            media={m}
            radius={8}
            padding={16}
            sizes={PAIR_SIZES}
            style={{ aspectRatio: "4 / 5" }}
          />
        ))}
      </div>
    );
  }
  const ratio = block.type === "wide" ? "16 / 9" : "21 / 9";
  return (
    <MediaFrame
      media={block.media}
      radius={8}
      padding={16}
      sizes={WIDE_SIZES}
      style={{ aspectRatio: ratio }}
    />
  );
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const next = nextProject(project.slug);

  return (
    <>
      <ProjectHeader nextName={next.name} nextHref={`/work/${next.slug}`} />
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
            {project.name}
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
            {project.intro}
          </p>
        </div>

        <div className="project-body">
          <aside
            className="rail"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
              padding: 26,
              background: "var(--bg-raised)",
              borderRadius: 10,
            }}
          >
            <Field label="ROLE" value={project.rail.role} />
            <Field label="CLIENT" value={project.rail.client} />
            <Field label="SCOPE" value={project.rail.scope} />
            <Field label="YEAR" value={project.rail.year} />
          </aside>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {project.blocks.map((block, i) => (
              <BlockView key={i} block={block} />
            ))}
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            padding: "44px var(--gutter)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
          }}
        >
          <Link href={`/work/${next.slug}`} style={{ display: "block" }}>
            <div
              className="font-mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                color: "var(--text-fainter)",
              }}
            >
              NEXT PROJECT
            </div>
            <div style={{ marginTop: 10, fontSize: 32, fontWeight: 500 }}>
              {next.name}
            </div>
          </Link>
          <Link
            href={`/work/${next.slug}`}
            aria-label={`Next project: ${next.name}`}
            style={{ flex: "0 0 auto" }}
          >
            <MediaFrame
              media={next.card}
              slot=""
              radius={6}
              padding={0}
              sizes="220px"
              style={{ width: 220, height: 130, maxWidth: "40vw" }}
            />
          </Link>
        </div>
      </main>
    </>
  );
}
