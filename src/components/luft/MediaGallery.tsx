"use client";

import { useCallback, useEffect, useState } from "react";

// Shared media gallery for a detail page (parts + car listings): a capped
// landscape hero + square thumbnails, with a click-to-enlarge lightbox that
// shows each photo at its original size (object-fit: contain, uncropped).
// Keyboard: Esc closes, ←/→ page. Replaces the old fixed-height split gallery,
// which cropped awkwardly and squished on mobile.
export function MediaGallery({ photos, badge }: { photos: string[]; badge: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const has = photos.length > 0;
  const hero = photos[0];
  const thumbs = photos.slice(1);

  const close = useCallback(() => setOpen(null), []);
  const go = useCallback(
    (dir: number) => setOpen((cur) => (cur == null ? cur : (cur + dir + photos.length) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (open == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close, go]);

  return (
    <>
      <div style={{ maxWidth: 920 }}>
        {/* HERO */}
        <div
          className={has ? "" : "luft-hatch"}
          onClick={has ? () => setOpen(0) : undefined}
          style={{ position: "relative", border: "1px solid #e6e5e2", background: has ? "#0d0d0d" : undefined, aspectRatio: "3 / 2", overflow: "hidden", cursor: has ? "zoom-in" : "default" }}
        >
          {has ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="mono" style={{ fontSize: 12, color: "#a3a29d" }}>[ no photo provided ]</span>
            </div>
          )}
          <span className="mono" style={{ position: "absolute", top: 16, left: 16, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", background: "#0d0d0d", color: "#ffffff", padding: "5px 9px" }}>
            {badge}
          </span>
          {has && (
            <span className="mono" style={{ position: "absolute", bottom: 12, right: 12, fontSize: 10, background: "rgba(13,13,13,.72)", color: "#ffffff", padding: "5px 9px" }}>
              Click to enlarge
            </span>
          )}
        </div>

        {/* THUMBNAILS */}
        {thumbs.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10, marginTop: 10 }}>
            {thumbs.map((ph, i) => (
              <div
                key={i}
                onClick={() => setOpen(i + 1)}
                style={{ position: "relative", aspectRatio: "1 / 1", background: "#0d0d0d", border: "1px solid #e6e5e2", overflow: "hidden", cursor: "zoom-in" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ph} alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LIGHTBOX */}
      {open != null && (
        <div
          onClick={close}
          role="dialog"
          aria-modal="true"
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(8,8,8,.93)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[open]}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "95vw", maxHeight: "92vh", objectFit: "contain", boxShadow: "0 12px 64px rgba(0,0,0,.6)" }}
          />
          <button onClick={(e) => { e.stopPropagation(); close(); }} aria-label="Close" style={lbBtn({ top: 18, right: 20, fontSize: 26 })}>
            ×
          </button>
          {photos.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous" style={lbBtn({ left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 30 })}>
                ‹
              </button>
              <button onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next" style={lbBtn({ right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 30 })}>
                ›
              </button>
              <div className="mono" style={{ position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", color: "#e6e5e2", fontSize: 12, letterSpacing: "0.08em" }}>
                {open + 1} / {photos.length}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function lbBtn(pos: React.CSSProperties): React.CSSProperties {
  return {
    position: "absolute",
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 0,
    border: "1px solid rgba(255,255,255,.35)",
    background: "rgba(20,20,20,.6)",
    color: "#ffffff",
    cursor: "pointer",
    borderRadius: 2,
    ...pos,
  };
}
