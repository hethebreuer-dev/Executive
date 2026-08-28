import Link from "next/link";
import type { Project } from "@/data/types";
import { MediaFrame } from "./MediaFrame";

const CARD_SIZES =
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

// A work-grid card. Role and result read in text before any click — the whole
// point of the rebuild.
export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/work/${project.slug}`}
      className="group-card"
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <MediaFrame
        media={project.card}
        slot={project.slot}
        sizes={CARD_SIZES}
        zoom
        style={{ aspectRatio: "4 / 5" }}
      />
      <div style={{ fontSize: 21, fontWeight: 500 }}>{project.name}</div>
      <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--text-dim)" }}>
        {project.role}
      </div>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.5,
          color: "var(--text-strong-body)",
        }}
      >
        {project.result}
      </div>
    </Link>
  );
}
