import Link from "next/link";
import type { Venture } from "@/data/types";
import { MediaFrame } from "./MediaFrame";

const VENTURE_SIZES =
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

export function VenturesGrid({ ventures }: { ventures: Venture[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(var(--ventures-cols, 3), 1fr)",
        gap: 24,
      }}
    >
      {ventures.map((v) => (
        <Link
          key={v.slug}
          href={`/ventures/${v.slug}`}
          className="group-card"
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <MediaFrame
            media={v.media}
            slot={v.slot}
            sizes={VENTURE_SIZES}
            zoom
            style={{
              height: 280,
              backgroundColor: "var(--bg-placeholder-alt)",
            }}
          />
          <div style={{ fontSize: 19, fontWeight: 500 }}>{v.name}</div>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--text-dim)" }}>
            {v.role}
          </div>
        </Link>
      ))}
    </div>
  );
}
