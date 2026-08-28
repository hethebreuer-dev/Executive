import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectHeader } from "@/components/Header";
import { DetailBody, NextFooter } from "@/components/DetailBody";
import { getProject, nextProject, projects } from "@/data/projects";

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
  return { title: project.name, description: project.result };
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

        <DetailBody
          rail={[
            { label: "ROLE", value: project.rail.role },
            { label: "CLIENT", value: project.rail.client },
            { label: "SCOPE", value: project.rail.scope },
            { label: "YEAR", value: project.rail.year },
          ]}
          blocks={project.blocks}
        />

        <NextFooter
          label="NEXT PROJECT"
          name={next.name}
          href={`/work/${next.slug}`}
          card={next.card}
        />
      </main>
    </>
  );
}
