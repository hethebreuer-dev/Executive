"use client";

import { useState } from "react";

// Email capture for the daily "new listings" digest. Posts to /api/subscribe.
// `tone` flips the palette for use on the dark footer vs a light section.
export function SubscribeForm({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const dark = tone === "dark";
  const ink = dark ? "#ffffff" : "#0d0d0d";
  const line = dark ? "#3a3a3a" : "#0d0d0d";
  const fieldBg = dark ? "#151515" : "#ffffff";
  const muted = dark ? "#cfcfca" : "#5e5e5a";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "busy") return;
    if (!consent) {
      setState("error");
      setMsg("Please tick the box to agree to receive the emails.");
      return;
    }
    setState("busy");
    setMsg("");
    try {
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setState("done");
        setMsg(j.status === "active" ? "active" : "pending");
        setEmail("");
      } else {
        setState("error");
        setMsg(j.error || "Something went wrong.");
      }
    } catch {
      setState("error");
      setMsg("Could not reach the server.");
    }
  }

  if (state === "done") {
    return (
      <p style={{ fontSize: 14, color: muted, lineHeight: 1.5, maxWidth: 440 }}>
        {msg === "active"
          ? "You’re already subscribed — we’ll keep emailing you the new listings each morning."
          : "Almost there — check your inbox and click the confirmation link to start getting the daily listings. (Check spam if you don’t see it.)"}
      </p>
    );
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 440 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email address"
          disabled={state === "busy"}
          style={{
            flex: 1,
            minWidth: 200,
            border: `1px solid ${line}`,
            background: fieldBg,
            color: ink,
            borderRadius: 2,
            padding: "12px 14px",
            fontSize: 14,
            outline: "none",
            fontFamily: "var(--font-libre-franklin), sans-serif",
          }}
        />
        <button
          type="submit"
          disabled={state === "busy"}
          style={{
            background: ink,
            color: dark ? "#0d0d0d" : "#ffffff",
            border: "none",
            borderRadius: 2,
            padding: "12px 22px",
            fontSize: 14,
            fontWeight: 600,
            cursor: state === "busy" ? "default" : "pointer",
            fontFamily: "var(--font-libre-franklin), sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          {state === "busy" ? "…" : "Get daily listings"}
        </button>
      </div>
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          marginTop: 10,
          fontSize: 12.5,
          color: muted,
          lineHeight: 1.45,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          aria-label="Consent to receive emails"
          style={{ marginTop: 2, accentColor: dark ? "#ffffff" : "#0d0d0d", flexShrink: 0 }}
        />
        <span>Email me a daily digest of new air-cooled listings. I can unsubscribe anytime.</span>
      </label>
      {state === "error" && (
        <div style={{ fontSize: 13, color: dark ? "#e6a5a5" : "#0d0d0d", marginTop: 8 }}>{msg}</div>
      )}
    </form>
  );
}
