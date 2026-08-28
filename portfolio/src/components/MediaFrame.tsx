import Image from "next/image";
import type { CSSProperties } from "react";
import type { Media } from "@/data/types";

// Renders a photograph, or the designed lo-fi placeholder (striped grey ground
// with a mono slot label) when the photography isn't wired yet. The dark ground
// under the image means loading never flashes light.
export function MediaFrame({
  media,
  slot,
  radius = 6,
  sizes,
  priority = false,
  padding = 14,
  zoom = false,
  style,
}: {
  media?: Media;
  /** Slot label shown when there's no image (falls back to media.slot). */
  slot?: string;
  radius?: number;
  sizes?: string;
  priority?: boolean;
  padding?: number;
  /** Enable the hover lift (cards only). */
  zoom?: boolean;
  style?: CSSProperties;
}) {
  const hasImg = Boolean(media?.src);
  const label = slot ?? media?.slot;

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: radius,
        backgroundColor: "var(--bg-placeholder)",
        backgroundImage: hasImg ? undefined : "var(--stripe)",
        display: "flex",
        alignItems: "flex-end",
        padding,
        ...style,
      }}
    >
      {hasImg && (
        <Image
          src={media!.src!}
          alt={media!.alt ?? ""}
          fill
          sizes={sizes}
          priority={priority}
          className={zoom ? "media-zoom" : undefined}
          style={{
            objectFit: "cover",
            objectPosition: media!.position ?? "center",
          }}
        />
      )}
      {!hasImg && label ? (
        <span
          className="font-mono"
          style={{
            position: "relative",
            fontSize: 11,
            letterSpacing: "0.08em",
            color: "var(--text-slot)",
          }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
