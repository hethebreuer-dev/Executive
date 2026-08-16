"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth, initialsFor } from "@/components/luft/AuthProvider";
import { Auth, Avatar } from "@/components/luft/Auth";
import { FooterGrid } from "@/components/luft/Footer";
import { usd } from "@/lib/luft";
import type { SellerListing } from "@/lib/luft/model";
import { partModelLabel, type Part } from "@/lib/luft/parts-model";

type TabId = "listings" | "parts" | "saved" | "messages";

const STATUS_LABEL: Record<string, string> = {
  active: "● Live",
  pending: "◔ In review",
  withdrawn: "Withdrawn",
};

export default function AccountPage() {
  const { user, ready, signIn } = useAuth();
  const [tab, setTab] = useState<TabId>("listings");
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [busyId, setBusyId] = useState(""); // listing being removed
  const [removeErr, setRemoveErr] = useState("");
  const [parts, setParts] = useState<Part[]>([]);
  const [partsLoading, setPartsLoading] = useState(true);
  const [partBusyId, setPartBusyId] = useState("");
  const [partErr, setPartErr] = useState("");

  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      setPartsLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setPartsLoading(true);
    const em = encodeURIComponent(user.email);
    fetch(`/api/account/listings?email=${em}`)
      .then((r) => r.json())
      .then((j) => {
        if (alive) setListings((j.listings as SellerListing[]) || []);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    fetch(`/api/account/parts?email=${em}`)
      .then((r) => r.json())
      .then((j) => {
        if (alive) setParts((j.parts as Part[]) || []);
      })
      .catch(() => {})
      .finally(() => alive && setPartsLoading(false));
    return () => {
      alive = false;
    };
  }, [user?.email]);

  if (!ready) return <div style={{ minHeight: "60vh" }} />;

  if (!user) {
    return (
      <div style={{ background: "#ffffff" }}>
        <section className="luft-container" style={{ padding: "120px 40px 140px", display: "flex", justifyContent: "center" }}>
          <div style={{ maxWidth: 460, textAlign: "center" }}>
            <div className="lbl" style={{ color: "#0d0d0d" }}>
              Your Garage
            </div>
            <h1 className="display luft-h1" style={{ fontWeight: 600, fontSize: 52, lineHeight: 0.98, textTransform: "uppercase", margin: "14px 0" }}>
              Sign in to
              <br />
              your garage
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "#5e5e5a", marginBottom: 30 }}>
              Track your listings against live comps, manage saved cars, and pick up
              buyer messages — all in one place.
            </p>
            <div style={{ display: "inline-flex", gap: 12, justifyContent: "center", background: "#0d0d0d", color: "#fff", padding: 2 }}>
              <div style={{ padding: "14px 26px", display: "flex" }}>
                <Auth onDark />
              </div>
            </div>
            <p className="mono" style={{ fontSize: 11, color: "#adaca7", marginTop: 18 }}>
              Use the Sign in control above — any email works in this prototype.
            </p>
          </div>
        </section>
        <FooterGrid />
      </div>
    );
  }

  const first = (user.name || "").split(" ")[0] || "there";
  const live = listings.filter((l) => l.status === "active");
  const review = listings.filter((l) => l.status === "pending");

  const kpis = [
    { label: "Live listings", value: String(live.length) },
    { label: "Parts listed", value: String(parts.length) },
    { label: "In review", value: String(review.length) },
    { label: "Plan", value: "Free" },
  ];

  const tabDefs: { id: TabId; label: string; badge: string }[] = [
    { id: "listings", label: "Listings", badge: listings.length ? String(listings.length) : "" },
    { id: "parts", label: "Parts", badge: parts.length ? String(parts.length) : "" },
    { id: "saved", label: "Saved", badge: "" },
    { id: "messages", label: "Messages", badge: "" },
  ];

  function saveName() {
    const name = nameDraft.trim();
    setEditingName(false);
    if (!name || !user || name === user.name) return;
    // Persist through auth so the header avatar and greeting update everywhere.
    signIn({ ...user, name, initials: initialsFor(name, user.email) });
  }

  async function removeListing(id: string) {
    if (!user?.email) return;
    if (!window.confirm("Remove this listing? It will be taken off the marketplace. This can't be undone.")) return;
    setBusyId(id);
    setRemoveErr("");
    try {
      const r = await fetch("/api/account/delete-listing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: user.email, id }),
      });
      if (r.ok) {
        setListings((prev) => prev.filter((l) => l.id !== id));
      } else {
        const j = await r.json().catch(() => ({}));
        setRemoveErr(j.error || "Could not remove the listing.");
      }
    } catch {
      setRemoveErr("Could not remove the listing.");
    } finally {
      setBusyId("");
    }
  }

  async function removePart(id: string) {
    if (!user?.email) return;
    if (!window.confirm("Remove this part? It will be taken off the parts marketplace. This can't be undone.")) return;
    setPartBusyId(id);
    setPartErr("");
    try {
      const r = await fetch("/api/account/delete-part", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: user.email, id }),
      });
      if (r.ok) {
        setParts((prev) => prev.filter((p) => p.id !== id));
      } else {
        const j = await r.json().catch(() => ({}));
        setPartErr(j.error || "Could not remove the part.");
      }
    } catch {
      setPartErr("Could not remove the part.");
    } finally {
      setPartBusyId("");
    }
  }

  return (
    <div style={{ background: "#ffffff" }}>
      {/* GREETING */}
      <section className="luft-container" style={{ padding: "52px 40px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Avatar initials={user.initials} size={54} />
            <div>
              <h1 className="display luft-h1" style={{ fontWeight: 600, fontSize: 48, lineHeight: 0.96, textTransform: "uppercase" }}>
                {first}&apos;s garage
              </h1>
              <div className="mono" style={{ fontSize: 12, color: "#8a8a85", marginTop: 6 }}>
                {user.email}
                {!editingName && (
                  <button
                    type="button"
                    onClick={() => {
                      setNameDraft(user.name);
                      setEditingName(true);
                    }}
                    style={{ marginLeft: 10, border: "none", background: "none", color: "#0d0d0d", textDecoration: "underline", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Edit display name
                  </button>
                )}
              </div>
              {editingName && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
                  <input
                    className="luft-field"
                    autoFocus
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                    placeholder="Username or display name"
                    aria-label="Display name"
                    style={{ maxWidth: 240, padding: "9px 12px" }}
                  />
                  <button type="button" onClick={saveName} style={{ background: "#0d0d0d", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, padding: "10px 18px", cursor: "pointer", fontFamily: "var(--font-libre-franklin), sans-serif" }}>
                    Save
                  </button>
                  <button type="button" onClick={() => setEditingName(false)} style={{ background: "#fff", color: "#0d0d0d", border: "1px solid #d9d8d4", fontSize: 13, fontWeight: 600, padding: "9px 16px", cursor: "pointer", fontFamily: "var(--font-libre-franklin), sans-serif" }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
          <Link href="/sell" style={{ background: "#0d0d0d", color: "#fff", fontSize: 15, fontWeight: 600, padding: "14px 24px" }}>
            List a car →
          </Link>
        </div>
      </section>

      {/* KPIS */}
      <section className="luft-container" style={{ padding: "36px 40px 0" }}>
        <div className="luft-grid-4" style={{ gap: 1, background: "#e6e5e2", border: "1px solid #e6e5e2" }}>
          {kpis.map((k) => (
            <div key={k.label} style={{ background: "#fff", padding: "24px 24px" }}>
              <div className="lbl" style={{ marginBottom: 12 }}>
                {k.label}
              </div>
              <div className="display" style={{ fontWeight: 600, fontSize: 36, lineHeight: 1 }}>
                {k.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TABS */}
      <section className="luft-container" style={{ padding: "44px 40px 0" }}>
        <div style={{ display: "flex", gap: 30, borderBottom: "1px solid #e6e5e2", flexWrap: "wrap" }}>
          {tabDefs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-libre-franklin), sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  padding: "0 0 14px",
                  marginBottom: -1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: active ? "#0d0d0d" : "#adaca7",
                  borderBottom: active ? "2px solid #0d0d0d" : "2px solid transparent",
                }}
              >
                {t.label}
                {t.badge && (
                  <span className="mono" style={{ fontSize: 10, padding: "2px 6px", borderRadius: 2, background: active ? "#0d0d0d" : "#eceae6", color: active ? "#fff" : "#8a8a85" }}>
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="luft-container" style={{ padding: "34px 40px 0", minHeight: 220 }}>
        {tab === "listings" &&
          (loading ? (
            <p style={{ color: "#8a8a85" }}>Loading your listings…</p>
          ) : listings.length ? (
            <>
              {removeErr && (
                <div style={{ fontSize: 13, color: "#0d0d0d", background: "#f2f1ef", padding: "10px 14px", marginBottom: 16 }}>{removeErr}</div>
              )}
              <div className="luft-grid-3" style={{ gap: 24 }}>
                {listings.map((c) => {
                  const badge = STATUS_LABEL[c.status] ?? c.status;
                  const removing = busyId === c.id;
                  const image = (
                    <div style={{ position: "relative", height: 180, borderBottom: "1px solid #e6e5e2", background: c.photos[0] ? "#0d0d0d" : undefined }} className={c.photos[0] ? "" : "luft-hatch"}>
                      {c.photos[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.photos[0]} alt={c.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      )}
                      <span className="mono" style={{ position: "absolute", top: 12, right: 12, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", background: "#0d0d0d", color: "#fff", padding: "5px 8px" }}>
                        {badge}
                      </span>
                    </div>
                  );
                  return (
                    <div key={c.id} style={{ border: "1px solid #e6e5e2", display: "flex", flexDirection: "column" }}>
                      {c.status === "active" ? (
                        <Link href={`/listing/${encodeURIComponent(c.id)}`} style={{ display: "block", color: "inherit" }}>
                          {image}
                        </Link>
                      ) : (
                        image
                      )}
                      <div style={{ padding: "18px 18px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
                        <div className="display" style={{ fontWeight: 600, fontSize: 19, textTransform: "uppercase", lineHeight: 1.05 }}>
                          {c.year} {c.title}
                        </div>
                        <div style={{ fontSize: 13, color: "#8a8a85", margin: "4px 0 12px" }}>
                          {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #eceae6", paddingTop: 12 }}>
                          <span className="mono" style={{ fontSize: 17, fontWeight: 500 }}>{usd(c.price)}</span>
                          {c.status === "active" ? (
                            <Link href={`/listing/${encodeURIComponent(c.id)}`} style={{ fontSize: 13, color: "#0d0d0d", fontWeight: 500 }}>
                              View →
                            </Link>
                          ) : (
                            <span style={{ fontSize: 13, color: "#8a8a85" }}>
                              {c.status === "pending" ? "Awaiting review" : "Withdrawn"}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeListing(c.id)}
                          disabled={removing}
                          style={{ marginTop: 14, width: "100%", border: "1px solid #d9d8d4", background: "#ffffff", color: "#0d0d0d", fontSize: 13, fontWeight: 600, padding: "10px 0", cursor: removing ? "default" : "pointer", fontFamily: "var(--font-libre-franklin), sans-serif" }}
                        >
                          {removing ? "Removing…" : "Remove listing"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyState
              text="You haven't listed a car yet."
              cta={{ href: "/sell", label: "List your car →" }}
            />
          ))}

        {tab === "parts" &&
          (partsLoading ? (
            <p style={{ color: "#8a8a85" }}>Loading your parts…</p>
          ) : parts.length ? (
            <>
              {partErr && (
                <div style={{ fontSize: 13, color: "#0d0d0d", background: "#f2f1ef", padding: "10px 14px", marginBottom: 16 }}>{partErr}</div>
              )}
              <div className="luft-grid-3" style={{ gap: 24 }}>
                {parts.map((p) => {
                  const removing = partBusyId === p.id;
                  return (
                    <div key={p.id} style={{ border: "1px solid #e6e5e2", display: "flex", flexDirection: "column" }}>
                      <Link href={`/parts/${encodeURIComponent(p.id)}`} style={{ display: "block", color: "inherit" }}>
                        <div style={{ position: "relative", height: 180, borderBottom: "1px solid #e6e5e2", background: p.photos[0] ? "#0d0d0d" : undefined }} className={p.photos[0] ? "" : "luft-hatch"}>
                          {p.photos[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.photos[0]} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          )}
                          <span className="mono" style={{ position: "absolute", top: 12, right: 12, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", background: "#0d0d0d", color: "#fff", padding: "5px 8px" }}>
                            {p.model === "all" ? "Fits multiple" : partModelLabel(p.model)}
                          </span>
                        </div>
                      </Link>
                      <div style={{ padding: "18px", display: "flex", flexDirection: "column", flex: 1 }}>
                        <div className="display" style={{ fontWeight: 600, fontSize: 19, textTransform: "uppercase", lineHeight: 1.05 }}>
                          {p.title}
                        </div>
                        {p.partNumber && (
                          <div className="mono" style={{ fontSize: 11, color: "#8a8a85", margin: "6px 0 0" }}>
                            Part # {p.partNumber}
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #eceae6", paddingTop: 12, marginTop: 12 }}>
                          <span className="mono" style={{ fontSize: 17, fontWeight: 500 }}>
                            {p.price ? usd(p.price) : "Make an offer"}
                          </span>
                          <Link href={`/parts/${encodeURIComponent(p.id)}`} style={{ fontSize: 13, color: "#0d0d0d", fontWeight: 500 }}>
                            View →
                          </Link>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePart(p.id)}
                          disabled={removing}
                          style={{ marginTop: 14, width: "100%", border: "1px solid #d9d8d4", background: "#ffffff", color: "#0d0d0d", fontSize: 13, fontWeight: 600, padding: "10px 0", cursor: removing ? "default" : "pointer", fontFamily: "var(--font-libre-franklin), sans-serif" }}
                        >
                          {removing ? "Removing…" : "Remove part"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyState
              text="You haven't listed a part yet. Sell used, NOS, or restored parts to air-cooled owners."
              cta={{ href: "/parts/sell", label: "List a part →" }}
            />
          ))}

        {tab === "saved" && (
          <EmptyState
            text="No saved cars yet. Tap Save on any listing to track it here against live comps."
            cta={{ href: "/marketplace", label: "Browse the market →" }}
          />
        )}

        {tab === "messages" && (
          <EmptyState text="No messages yet. Buyer messages about your listings will appear here." />
        )}
      </section>

      <FooterGrid />
    </div>
  );
}

function EmptyState({ text, cta }: { text: string; cta?: { href: string; label: string } }) {
  return (
    <div style={{ border: "1px solid #e6e5e2", padding: "56px 40px", textAlign: "center" }}>
      <p style={{ fontSize: 16, color: "#5e5e5a", marginBottom: cta ? 18 : 0, maxWidth: 460, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
        {text}
      </p>
      {cta && (
        <Link href={cta.href} style={{ background: "#0d0d0d", color: "#fff", fontSize: 15, fontWeight: 600, padding: "13px 24px" }}>
          {cta.label}
        </Link>
      )}
    </div>
  );
}
