"use client";

import { useState } from "react";

// Email capture for the daily "new listings" digest. Posts to /api/subscribe.
// `tone` flips the palette for use on the dark footer vs a light section.
export function SubscribeForm({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const dark = tone === "dark";
  const ink = dark ? "#ffffff" : "#0d0d0d";
  const line = dark ? "#3a3a3a" : "#0d0d0d";
  const fieldBg = dark ? "#151515" : "#ffffff";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "busy") return;
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
      <p style={{ fontSize: 14, color: dark ? "#cfcfca" : "#5e5e5a", lineHeight: 1.5 }}>
        You&rsquo;re in. We&rsquo;ll email you the new air-cooled listings each morning.
      </p>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexWrap: "wrap", gap: 8, maxWidth: 440 }}>
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
      {state === "error" && (
        <div style={{ flexBasis: "100%", fontSize: 13, color: dark ? "#e6a5a5" : "#0d0d0d" }}>{msg}</div>
      )}
    </form>
  );
}
