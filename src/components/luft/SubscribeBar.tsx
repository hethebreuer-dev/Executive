"use client";

import { useEffect, useState } from "react";
import { SubscribeForm } from "./SubscribeForm";

// Dismissible sticky email-capture bar for long, unpaginated pages (the
// marketplace) where users never scroll to the footer form. Appears after a
// little scrolling so it isn't intrusive on load, and stays gone once the
// visitor dismisses it or subscribes (remembered in localStorage).
const KEY = "luft_email_bar_dismissed";

export function SubscribeBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(KEY) === "1";
    } catch {
      /* ignore */
    }
    if (dismissed) return;
    const reveal = () => {
      setShow(true);
      cleanup();
    };
    // Show after a little scrolling — or, as a fallback, after a short dwell, so
    // it still appears on desktop / short pages where the visitor barely scrolls.
    const onScroll = () => {
      if (window.scrollY > 400) reveal();
    };
    const timer = setTimeout(reveal, 9000);
    function cleanup() {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // in case the page is already scrolled
    return cleanup;
  }, []);

  const persistDismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Email signup"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
        background: "#0d0d0d",
        color: "#ffffff",
        borderTop: "1px solid #2a2a2a",
        boxShadow: "0 -10px 30px rgba(0,0,0,0.22)",
      }}
    >
      <div
        className="luft-container"
        style={{
          position: "relative",
          padding: "16px 56px 18px 40px",
          display: "flex",
          alignItems: "center",
          gap: 28,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <div
            className="display"
            style={{ fontSize: 17, fontWeight: 600, textTransform: "uppercase", lineHeight: 1.1 }}
          >
            New listings, every morning
          </div>
          <div style={{ fontSize: 13.5, color: "#b0afaa", marginTop: 3 }}>
            The day&rsquo;s new air-cooled 911s, 912s &amp; 930s, straight to your inbox.
          </div>
        </div>
        <div style={{ flex: "0 1 auto" }}>
          <SubscribeForm tone="dark" onSuccess={persistDismiss} />
        </div>
        <button
          type="button"
          onClick={() => {
            persistDismiss();
            setShow(false);
          }}
          aria-label="Dismiss email signup"
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            width: 28,
            height: 28,
            border: "none",
            background: "transparent",
            color: "#8a8a85",
            fontSize: 22,
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
