import Image from "next/image";
import Link from "next/link";
import { MediaFrame } from "./MediaFrame";
import type { Block, Media } from "@/data/types";

const WIDE_SIZES = "(max-width: 900px) 100vw, 68vw";
const PAIR_SIZES = "(max-width: 900px) 50vw, 34vw";

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
  if (block.type === "pair" || block.type === "duo") {
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
  if (block.type === "plate") {
    const m = block.media;
    if (m.src && m.w && m.h) {
      return (
        <Image
          src={m.src}
          alt={m.alt ?? ""}
          width={m.w}
          height={m.h}
          sizes={block.maxW ? `${block.maxW}px` : WIDE_SIZES}
          style={{
            width: "100%",
            height: "auto",
            maxWidth: block.maxW,
            margin: block.maxW ? "0 auto" : undefined,
            borderRadius: 8,
            display: "block",
          }}
        />
      );
    }
    return (
      <MediaFrame
        media={m}
        radius={8}
        padding={16}
        sizes={WIDE_SIZES}
        style={{
          aspectRatio: "16 / 9",
          maxWidth: block.maxW,
          margin: block.maxW ? "0 auto" : undefined,
        }}
      />
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

// Sticky labelled rail + the gallery block column. Shared by project and
// venture detail pages; `rail` is a list of labelled fields.
export function DetailBody({
  rail,
  blocks,
}: {
  rail: { label: string; value: string }[];
  blocks: Block[];
}) {
  return (
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
        {rail.map((f) => (
          <Field key={f.label} label={f.label} value={f.value} />
        ))}
      </aside>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {blocks.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}
      </div>
    </div>
  );
}

// Next-item footer, shared by project and venture detail pages.
export function NextFooter({
  label,
  name,
  href,
  card,
}: {
  label: string;
  name: string;
  href: string;
  card?: Media;
}) {
  return (
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
      <Link href={href} style={{ display: "block" }}>
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
        <div style={{ marginTop: 10, fontSize: 32, fontWeight: 500 }}>{name}</div>
      </Link>
      <Link href={href} aria-label={`${label}: ${name}`} style={{ flex: "0 0 auto" }}>
        <MediaFrame
          media={card}
          slot=""
          radius={6}
          padding={0}
          sizes="220px"
          style={{ width: 220, height: 130, maxWidth: "40vw" }}
        />
      </Link>
    </div>
  );
}
