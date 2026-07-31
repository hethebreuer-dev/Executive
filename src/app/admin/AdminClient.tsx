"use client";

import { useEffect, useState } from "react";

type Pending = {
  id: string;
  title: string;
  year: number;
  model_family: string;
  price: number;
  seller_name: string | null;
  seller_email: string | null;
  seller_phone: string | null;
  seller_contact: string | null;
  city: string | null;
  state: string | null;
  submitted_at: string | null;
  photos: string | null;
};

const usd = (n: number) => "$" + n.toLocaleString("en-US");

export function AdminClient({ adminKey }: { adminKey: string }) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    if (!adminKey) {
      setState("idle");
      return;
    }
    let alive = true;
    setState("loading");
    fetch(`/api/admin/pending?key=${encodeURIComponent(adminKey)}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!alive) return;
        if (!r.ok) {
          setError(r.status === 401 ? "Invalid admin key." : j.error || "Failed to load.");
          setState("error");
          return;
        }
        setPending((j.pending as Pending[]) || []);
        setState("ready");
      })
      .catch(() => {
        if (alive) {
          setError("Could not reach the server.");
          setState("error");
        }
      });
    return () => {
      alive = false;
    };
  }, [adminKey]);

  async function moderate(id: string, action: "approve" | "reject") {
    setBusyId(id);
    try {
      const r = await fetch("/api/admin/moderate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: adminKey, id, action }),
      });
      if (r.ok) setPending((p) => p.filter((x) => x.id !== id));
      else {
        const j = await r.json().catch(() => ({}));
        setError(j.error || "Action failed.");
      }
    } catch {
      setError("Action failed.");
    } finally {
      setBusyId("");
    }
  }

  if (!adminKey) {
    return (
      <div style={{ border: "1px solid #e6e5e2", padding: "40px 32px", fontSize: 15, color: "#5e5e5a" }}>
        Add your admin key to the URL to view the queue: <code className="mono">/admin?key=YOUR_KEY</code>
      </div>
    );
  }
  if (state === "loading") return <p style={{ color: "#8a8a85" }}>Loading…</p>;
  if (state === "error")
    return <div style={{ border: "1px solid #e6e5e2", padding: "24px 28px", color: "#0d0d0d", background: "#f2f1ef" }}>{error}</div>;

  if (state === "ready" && !pending.length) {
    return (
      <div style={{ border: "1px solid #e6e5e2", padding: "48px 32px", textAlign: "center", color: "#5e5e5a" }}>
        No listings awaiting review. 🎉
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {error && (
        <div style={{ fontSize: 13, color: "#0d0d0d", background: "#f2f1ef", padding: "10px 14px" }}>{error}</div>
      )}
      {pending.map((c) => {
        const photos = c.photos ? (JSON.parse(c.photos) as string[]) : [];
        return (
          <div key={c.id} style={{ border: "1px solid #0d0d0d", display: "grid", gridTemplateColumns: "220px 1fr", overflow: "hidden" }}>
            <div style={{ background: "#0d0d0d", minHeight: 160, position: "relative" }}>
              {photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photos[0]} alt={c.title} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
              ) : (
                <span className="mono" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#8a8a85", fontSize: 11 }}>
                  No photo
                </span>
              )}
            </div>
            <div style={{ padding: "22px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div className="display" style={{ fontWeight: 600, fontSize: 22, textTransform: "uppercase", lineHeight: 1 }}>
                  {c.year} {c.title}
                </div>
                <div className="mono" style={{ fontSize: 18 }}>{usd(c.price)}</div>
              </div>
              <div style={{ fontSize: 13, color: "#5e5e5a", marginTop: 8, lineHeight: 1.6 }}>
                {[c.seller_name, c.seller_email, c.seller_phone].filter(Boolean).join(" · ") || "No contact"}
                <br />
                {[c.city, c.state].filter(Boolean).join(", ") || "Location n/a"}
                {c.seller_contact ? ` · prefers ${c.seller_contact}` : ""}
                {" · "}
                {photos.length} photo{photos.length === 1 ? "" : "s"}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
                <button
                  type="button"
                  disabled={busyId === c.id}
                  onClick={() => moderate(c.id, "approve")}
                  style={{ background: "#0d0d0d", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, padding: "11px 22px", cursor: "pointer", fontFamily: "var(--font-libre-franklin), sans-serif" }}
                >
                  {busyId === c.id ? "…" : "Approve → publish"}
                </button>
                <button
                  type="button"
                  disabled={busyId === c.id}
                  onClick={() => moderate(c.id, "reject")}
                  style={{ background: "#fff", color: "#0d0d0d", border: "1px solid #0d0d0d", fontSize: 14, fontWeight: 600, padding: "11px 22px", cursor: "pointer", fontFamily: "var(--font-libre-franklin), sans-serif" }}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
