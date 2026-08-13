"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/luft/AuthProvider";

type Msg = { role: "user" | "assistant"; content: string };

export function WorkshopChat({
  chassis,
  suggestions,
}: {
  chassis: string;
  suggestions: string[];
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setError("");
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/workshop", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chassis, messages: next }),
      });
      if (!res.ok || !res.body) {
        throw new Error(
          res.status === 503
            ? "The Workshop AI isn't switched on yet — check back soon."
            : "Something went wrong. Please try again."
        );
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = m.slice();
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
      if (!acc.trim()) throw new Error("No response — please try again.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setMessages((m) => (m[m.length - 1]?.content ? m : m.slice(0, -1)));
    } finally {
      setBusy(false);
    }
  }

  const shell: React.CSSProperties = {
    border: "1px solid #e6e5e2",
    borderTop: "none",
    background: "#0d0d0d",
    color: "#ffffff",
    padding: "30px 32px",
  };

  const header = (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ffffff" }} />
      <span className="lbl" style={{ color: "#cfcfca" }}>
        Ask the Workshop · AI, tuned to {chassis.replace(/\s*\(.*\)$/, "")}
      </span>
    </div>
  );

  // Signed-out gate — the AI requires sign-in.
  if (!user) {
    return (
      <div style={shell}>
        {header}
        <div
          style={{
            marginTop: 22,
            border: "1px solid #262626",
            background: "#151515",
            padding: "26px 24px",
            textAlign: "center",
          }}
        >
          <div className="display" style={{ fontSize: 22, textTransform: "uppercase" }}>
            Sign in to ask the Workshop
          </div>
          <p style={{ marginTop: 10, fontSize: 14, color: "#b0afaa", lineHeight: 1.55, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
            The AI service — chassis-specific diagnostics, torque specs, and
            procedures — is free for LUFT members. Use <strong style={{ color: "#fff" }}>Sign in</strong> at the top right to start a conversation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={shell}>
      {header}

      <div
        style={{
          marginTop: 20,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          maxHeight: 360,
          overflowY: "auto",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              alignSelf: "flex-start",
              maxWidth: "82%",
              border: "1px solid #262626",
              background: "#151515",
              padding: "15px 18px",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#dcdcd8",
            }}
          >
            Ask me anything about your {chassis.replace(/\s*\(.*\)$/, "")} — a
            symptom to diagnose, a torque spec, or how a job should go.
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div
              key={i}
              style={{
                alignSelf: "flex-end",
                maxWidth: "70%",
                background: "#262626",
                padding: "13px 16px",
                fontSize: 14,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content}
            </div>
          ) : (
            <div
              key={i}
              style={{
                alignSelf: "flex-start",
                maxWidth: "82%",
                border: "1px solid #262626",
                background: "#151515",
                padding: "15px 18px",
                fontSize: 14,
                lineHeight: 1.6,
                color: "#dcdcd8",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content || (
                <span style={{ color: "#8a8a85" }}>Thinking…</span>
              )}
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div style={{ marginTop: 12, fontSize: 13, color: "#e6a5a5" }}>{error}</div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 22,
          border: "1px solid #262626",
          background: "#151515",
          padding: "8px 8px 8px 16px",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe a symptom, or ask about any step…"
          disabled={busy}
          aria-label="Ask the Workshop AI"
          style={{
            flex: 1,
            minWidth: 0, // shrink inside the flex row instead of pushing the send button off-screen
            border: "none",
            background: "transparent",
            outline: "none",
            fontSize: 14,
            color: "#ffffff",
            fontFamily: "var(--font-libre-franklin), sans-serif",
          }}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          style={{
            background: busy || !input.trim() ? "#8a8a85" : "#ffffff",
            color: "#0d0d0d",
            fontWeight: 600,
            fontSize: 13,
            padding: "8px 16px",
            border: "none",
            cursor: busy || !input.trim() ? "default" : "pointer",
            fontFamily: "var(--font-libre-franklin), sans-serif",
          }}
        >
          {busy ? "…" : "Ask →"}
        </button>
      </form>

      {messages.length === 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          {suggestions.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => ask(p)}
              disabled={busy}
              className="mono"
              style={{
                fontSize: 11,
                border: "1px solid #262626",
                background: "transparent",
                color: "#b0afaa",
                padding: "7px 12px",
                cursor: busy ? "default" : "pointer",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
