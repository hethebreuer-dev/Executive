import Link from "next/link";
import { deltaText, type Listing, usd, miles } from "@/lib/luft";

// Live status row: pulsing dot + mono label.
export function LiveRow({
  children,
  pulse = true,
  marginBottom = 20,
}: {
  children: React.ReactNode;
  pulse?: boolean;
  marginBottom?: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom }}>
      <span className={pulse ? "luft-dot luft-dot--pulse" : "luft-dot"} />
      <span
        className="lbl"
        style={{ color: "#0d0d0d", fontSize: 11, letterSpacing: "0.24em" }}
      >
        {children}
      </span>
    </div>
  );
}

// A bordered hero image slot with a top-left mono tag. Uses a real image
// when `src` is given, otherwise a diagonal-hatch placeholder.
export function ImageSlot({
  src,
  alt,
  tag,
  tagDark,
  height,
  caption,
  className,
}: {
  src?: string;
  alt?: string;
  tag?: string;
  tagDark?: boolean; // dark tag on light bg (default) vs light tag on dark
  height?: number | string;
  caption?: string;
  className?: string;
}) {
  return (
    <div
      className={className ?? ""}
      style={{
        position: "relative",
        width: "100%",
        height,
        border: "1px solid #e6e5e2",
        overflow: "hidden",
        background: src
          ? "#e5e4e0"
          : "repeating-linear-gradient(135deg,#f1f0ed 0 12px,#e5e4e0 12px 24px)",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt ?? ""}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : null}
      {tag ? (
        <span
          className="mono"
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            background: tagDark === false ? "#ffffff" : "#0d0d0d",
            color: tagDark === false ? "#0d0d0d" : "#ffffff",
            padding: "5px 9px",
            pointerEvents: "none",
          }}
        >
          {tag}
        </span>
      ) : null}
      {caption && !src ? (
        <span
          className="mono"
          style={{ position: "absolute", bottom: 12, left: 12, fontSize: 11, color: "#a3a29d" }}
        >
          [ {caption} ]
        </span>
      ) : null}
    </div>
  );
}

// Marketplace / Home listing card (4:3).
export function ListingCard({ c, href = "/listing/1" }: { c: Listing; href?: string }) {
  return (
    <Link
      href={href}
      style={{ border: "1px solid #e6e5e2", display: "flex", flexDirection: "column" }}
    >
      <div className="luft-hatch" style={{ position: "relative", aspectRatio: "4 / 3" }}>
        <span
          className="mono"
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            fontSize: 9,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            background: "rgba(250,250,250,.92)",
            color: "#3f3f3d",
            padding: "4px 8px",
          }}
        >
          {c.source}
        </span>
        <span
          className="mono"
          style={{ position: "absolute", bottom: 12, left: 12, fontSize: 10, color: "#a3a29d" }}
        >
          [ {c.caption} ]
        </span>
        <span
          className="mono"
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            fontSize: 10,
            background: "rgba(12,12,12,.9)",
            color: "#dcdcd8",
            padding: "4px 7px",
          }}
        >
          {deltaText(c.delta)}
        </span>
      </div>
      <div style={{ padding: 18, display: "flex", flexDirection: "column", flex: 1 }}>
        <h3
          className="display"
          style={{ fontWeight: 500, fontSize: 23, textTransform: "uppercase", lineHeight: 1.05 }}
        >
          {c.year} {c.title}
        </h3>
        <div className="mono" style={{ fontSize: 12, color: "#8a8a85", marginTop: 7 }}>
          {miles(c.miles)} · {c.trans} · {c.city}, {c.state}
        </div>
        <div
          className="mono"
          style={{ fontSize: 20, fontWeight: 500, marginTop: 14 }}
        >
          {usd(c.price)}
        </div>
      </div>
    </Link>
  );
}

// Section header with a strong top rule.
export function SectionHead({
  title,
  action,
  size = 34,
}: {
  title: string;
  action?: React.ReactNode;
  size?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        borderTop: "1px solid #0d0d0d",
        paddingTop: 24,
      }}
    >
      <h2
        className="display"
        style={{ fontWeight: 600, fontSize: size, textTransform: "uppercase" }}
      >
        {title}
      </h2>
      {action}
    </div>
  );
}

// Primary/secondary CTA links.
export function CtaPrimary({
  href,
  children,
  large = false,
}: {
  href: string;
  children: React.ReactNode;
  large?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        background: "#0d0d0d",
        color: "#ffffff",
        fontSize: large ? 15 : 14,
        fontWeight: 600,
        padding: large ? "16px 30px" : "14px 26px",
      }}
    >
      {children}
    </Link>
  );
}

export function CtaSecondary({
  href,
  children,
  large = false,
}: {
  href: string;
  children: React.ReactNode;
  large?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        border: "1px solid #0d0d0d",
        color: "#0d0d0d",
        fontSize: large ? 15 : 14,
        fontWeight: 600,
        padding: large ? "15px 28px" : "13px 24px",
      }}
    >
      {children}
    </Link>
  );
}
