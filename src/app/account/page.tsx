"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/luft/AuthProvider";
import { Auth, Avatar } from "@/components/luft/Auth";
import { FooterGrid } from "@/components/luft/Footer";
import { usd, usdk } from "@/lib/luft";

const SAVED = [
  { id: 2, title: "1997 993 Carrera S", price: 189000, delta: 11, loc: "Denver, CO", move: "↓ $8k / 30d" },
  { id: 4, title: "1987 930 Turbo", price: 142000, delta: 2, loc: "Miami, FL", move: "↑ 2.1% / 30d" },
  { id: 7, title: "1991 964 Turbo 3.3", price: 265000, delta: 8, loc: "New York, NY", move: "↑ 5.0% / 90d" },
];

const ACTIVITY = [
  { tag: "Price drop", text: "993 Carrera S dropped $8,000 — now $189k, 11% under comp.", when: "2 hours ago" },
  { tag: "Message", text: "Daniel R. asked about the sunroof delete on your 911 SC.", when: "2 hours ago" },
  { tag: "Comp update", text: "930 Turbo median rose 2.1% over the past month.", when: "1 day ago" },
  { tag: "New match", text: "2 new cars match your saved search “911 SWB · project ok”.", when: "2 days ago" },
];

const MESSAGES = [
  { from: "Daniel R.", initials: "DR", car: "1983 911 SC", time: "2h", unread: true, text: "Is the sunroof delete factory original? Happy to arrange a PPI this week." },
  { from: "Marta K.", initials: "MK", car: "1983 911 SC", time: "1d", unread: true, text: "Would you consider $61k? I can close and collect within the week." },
  { from: "LUFT Concierge", initials: "LU", car: "1983 911 SC", time: "3d", unread: false, text: "Your listing passed 1,000 views — a featured boost typically lifts offers 30%." },
];

const ALERTS = [
  { q: "993 Carrera S · manual · under $200k", matches: 4, freq: "Daily" },
  { q: "964 · any body · under $150k", matches: 7, freq: "Instant" },
  { q: "911 SWB · project considered", matches: 2, freq: "Weekly" },
];

type TabId = "overview" | "saved" | "listings" | "messages" | "alerts";

export default function AccountPage() {
  const { user, ready } = useAuth();
  const [tab, setTab] = useState<TabId>("overview");
  const [savedIds, setSavedIds] = useState<number[]>([2, 4, 7]);

  const saved = useMemo(() => SAVED.filter((c) => savedIds.includes(c.id)), [savedIds]);
  const unread = MESSAGES.filter((m) => m.unread).length;
  const watchValue = saved.reduce((a, c) => a + c.price, 0);

  if (!ready) {
    return <div style={{ minHeight: "60vh" }} />;
  }

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
              Track saved cars against live comps, manage your listings, and pick up
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
  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";

  const kpis = [
    { label: "Cars watched", value: String(saved.length), sub: "3 comp moves this week" },
    { label: "Active listings", value: "1", sub: "9 days live" },
    { label: "Unread messages", value: String(unread), sub: "from 2 buyers" },
    { label: "Watchlist value", value: usdk(watchValue), sub: "↑ 3.9% / 90d" },
  ];

  const tabDefs: { id: TabId; label: string; badge: string }[] = [
    { id: "overview", label: "Overview", badge: "" },
    { id: "saved", label: "Saved", badge: saved.length ? String(saved.length) : "" },
    { id: "listings", label: "Listings", badge: "1" },
    { id: "messages", label: "Messages", badge: unread ? String(unread) : "" },
    { id: "alerts", label: "Alerts", badge: String(ALERTS.length) },
  ];

  const movers = saved.map((c) => ({ title: c.title.replace(/^\d+\s/, ""), move: c.move }));

  const listing = {
    title: "1983 911 SC Coupe",
    price: usd(64500),
    status: "Live",
    meta: "79,300 mi · 5-spd 915 · Guards Red · Seattle, WA",
  };
  const listingStats = [
    { label: "Views", value: "1,240" },
    { label: "Watchers", value: "38" },
    { label: "Offers", value: "2" },
    { label: "Vs comp", value: "Fair" },
  ];

  return (
    <div style={{ background: "#ffffff" }}>
      {/* GREETING */}
      <section className="luft-container" style={{ padding: "52px 40px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div className="lbl" style={{ color: "#0d0d0d" }}>
              Your Garage · Member since 2023
            </div>
            <h1 className="display luft-h1" style={{ fontWeight: 600, fontSize: 56, lineHeight: 0.96, textTransform: "uppercase", marginTop: 12 }}>
              {greeting},
              <br />
              {first}
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span className="mono" style={{ fontSize: 11, border: "1px solid #0d0d0d", padding: "8px 12px" }}>
              Free plan
            </span>
            <Link href="/sell" style={{ background: "#0d0d0d", color: "#fff", fontSize: 15, fontWeight: 600, padding: "14px 24px" }}>
              List a car →
            </Link>
          </div>
        </div>
      </section>

      {/* KPIS */}
      <section className="luft-container" style={{ padding: "40px 40px 0" }}>
        <div className="luft-grid-4" style={{ gap: 1, background: "#e6e5e2", border: "1px solid #e6e5e2" }}>
          {kpis.map((k) => (
            <div key={k.label} style={{ background: "#fff", padding: "26px 24px" }}>
              <div className="lbl" style={{ marginBottom: 14 }}>
                {k.label}
              </div>
              <div className="display" style={{ fontWeight: 600, fontSize: 38, lineHeight: 1 }}>
                {k.value}
              </div>
              <div className="mono" style={{ fontSize: 11, color: "#8a8a85", marginTop: 8 }}>
                {k.sub}
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
                  <span
                    className="mono"
                    style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 2,
                      background: active ? "#0d0d0d" : "#eceae6",
                      color: active ? "#fff" : "#8a8a85",
                    }}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="luft-container" style={{ padding: "34px 40px 0" }}>
        {tab === "overview" && (
          <div className="luft-grid-2" style={{ gridTemplateColumns: "1.5fr 1fr", gap: 48, alignItems: "start" }}>
            <div>
              <h2 className="display" style={{ fontWeight: 600, fontSize: 22, textTransform: "uppercase", borderBottom: "1px solid #0d0d0d", paddingBottom: 14, marginBottom: 6 }}>
                Recent activity
              </h2>
              {ACTIVITY.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 18, padding: "18px 0", borderBottom: "1px solid #eceae6" }}>
                  <span className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#fff", background: "#0d0d0d", padding: "5px 8px", height: "fit-content", whiteSpace: "nowrap" }}>
                    {a.tag}
                  </span>
                  <div>
                    <p style={{ fontSize: 15, lineHeight: 1.45 }}>{a.text}</p>
                    <span className="mono" style={{ fontSize: 11, color: "#adaca7" }}>
                      {a.when}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <aside className="luft-sticky-aside" style={{ position: "sticky", top: 96 }}>
              <div style={{ border: "1px solid #0d0d0d", padding: 24 }}>
                <div className="lbl" style={{ color: "#0d0d0d", marginBottom: 14 }}>
                  Watchlist movers
                </div>
                {movers.map((m) => (
                  <div key={m.title} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid #eceae6" }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{m.title}</span>
                    <span className="mono" style={{ fontSize: 12 }}>
                      {m.move}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ border: "1px solid #0d0d0d", borderTop: "none", padding: 24, background: "#0d0d0d", color: "#fff" }}>
                <div className="lbl" style={{ color: "#cfcfca", marginBottom: 8 }}>
                  LUFT Pro
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.5, color: "#e6e5e2", marginBottom: 16 }}>
                  Unlock full comp history, valuation alerts, and the AI Workshop —
                  free for 14 days.
                </p>
                <Link href="/workshop" style={{ display: "inline-block", background: "#fff", color: "#0d0d0d", fontSize: 14, fontWeight: 600, padding: "12px 20px" }}>
                  Upgrade to Pro →
                </Link>
              </div>
            </aside>
          </div>
        )}

        {tab === "saved" &&
          (saved.length > 0 ? (
            <div className="luft-grid-3" style={{ gap: 24 }}>
              {saved.map((c) => (
                <div key={c.id} style={{ border: "1px solid #e6e5e2" }}>
                  <div className="luft-hatch" style={{ position: "relative", height: 180, borderBottom: "1px solid #e6e5e2" }}>
                    <span className="mono" style={{ position: "absolute", top: 12, right: 12, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", background: "#0d0d0d", color: "#fff", padding: "5px 8px" }}>
                      {c.delta > 0 ? c.delta + "% under comp" : c.delta < 0 ? Math.abs(c.delta) + "% over comp" : "At comp"}
                    </span>
                  </div>
                  <div style={{ padding: "18px 18px 20px" }}>
                    <div className="display" style={{ fontWeight: 600, fontSize: 19, textTransform: "uppercase", lineHeight: 1.05 }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: 13, color: "#8a8a85", margin: "4px 0 12px" }}>{c.loc}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #eceae6", paddingTop: 12 }}>
                      <span className="mono" style={{ fontSize: 17, fontWeight: 500 }}>
                        {usd(c.price)}
                      </span>
                      <div style={{ display: "flex", gap: 14 }}>
                        <Link href={`/listing/${c.id}`} style={{ fontSize: 13, fontWeight: 600 }}>
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => setSavedIds((ids) => ids.filter((id) => id !== c.id))}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#8a8a85", fontFamily: "var(--font-libre-franklin), sans-serif", padding: 0 }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ border: "1px solid #e6e5e2", padding: "56px 40px", textAlign: "center" }}>
              <p style={{ fontSize: 16, color: "#5e5e5a", marginBottom: 18 }}>You haven&apos;t saved any cars yet.</p>
              <Link href="/marketplace" style={{ background: "#0d0d0d", color: "#fff", fontSize: 15, fontWeight: 600, padding: "13px 24px" }}>
                Browse the market →
              </Link>
            </div>
          ))}

        {tab === "listings" && (
          <>
            <div className="luft-stack-sm" style={{ border: "1px solid #0d0d0d", display: "grid", gridTemplateColumns: "280px 1fr" }}>
              <div className="luft-hatch" style={{ position: "relative", borderRight: "1px solid #e6e5e2", minHeight: 220 }}>
                <span className="mono" style={{ position: "absolute", top: 12, left: 12, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", background: "#0d0d0d", color: "#fff", padding: "5px 8px" }}>
                  {listing.status}
                </span>
              </div>
              <div style={{ padding: "26px 28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <div className="display" style={{ fontWeight: 600, fontSize: 26, textTransform: "uppercase", lineHeight: 1 }}>
                      {listing.title}
                    </div>
                    <div style={{ fontSize: 13, color: "#8a8a85", marginTop: 4 }}>{listing.meta}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 22, fontWeight: 500 }}>
                    {listing.price}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "#e6e5e2", border: "1px solid #e6e5e2", margin: "22px 0" }}>
                  {listingStats.map((s) => (
                    <div key={s.label} style={{ background: "#fff", padding: "16px 14px" }}>
                      <div className="lbl" style={{ marginBottom: 8 }}>
                        {s.label}
                      </div>
                      <div className="mono" style={{ fontSize: 20 }}>
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Link href="/listing/1" style={{ border: "1px solid #0d0d0d", fontSize: 14, fontWeight: 600, padding: "12px 22px" }}>
                    View listing
                  </Link>
                  <Link href="/sell" style={{ border: "1px solid #0d0d0d", fontSize: 14, fontWeight: 600, padding: "12px 22px" }}>
                    Edit details
                  </Link>
                  <Link href="/workshop" style={{ background: "#0d0d0d", color: "#fff", fontSize: 14, fontWeight: 600, padding: "13px 22px" }}>
                    Boost with Pro
                  </Link>
                </div>
              </div>
            </div>
            <Link href="/sell" style={{ display: "block", border: "1px dashed #c9c8c4", padding: 26, textAlign: "center", marginTop: 24, fontSize: 15, fontWeight: 600, color: "#0d0d0d" }}>
              + List another car
            </Link>
          </>
        )}

        {tab === "messages" && (
          <div style={{ border: "1px solid #e6e5e2" }}>
            {MESSAGES.map((m) => (
              <div key={m.from} style={{ display: "flex", gap: 18, padding: "20px 24px", borderBottom: "1px solid #eceae6", alignItems: "flex-start" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 16, flex: "0 0 auto", background: m.unread ? "#0d0d0d" : "transparent" }} />
                <Avatar initials={m.initials} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{m.from}</span>
                    <span className="mono" style={{ fontSize: 11, color: "#adaca7", whiteSpace: "nowrap" }}>
                      {m.time}
                    </span>
                  </div>
                  <div className="lbl" style={{ margin: "2px 0 6px" }}>
                    Re · {m.car}
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.5, color: "#3f3f3d" }}>{m.text}</p>
                </div>
                <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                  Reply
                </a>
              </div>
            ))}
          </div>
        )}

        {tab === "alerts" && (
          <div style={{ border: "1px solid #e6e5e2" }}>
            {ALERTS.map((a) => (
              <div key={a.q} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, padding: "20px 24px", borderBottom: "1px solid #eceae6", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{a.q}</div>
                  <div className="lbl" style={{ marginTop: 5 }}>
                    {a.freq} alerts
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <span className="mono" style={{ fontSize: 13 }}>
                    {a.matches} live
                  </span>
                  <Link href="/marketplace" style={{ border: "1px solid #0d0d0d", fontSize: 13, fontWeight: 600, padding: "10px 18px" }}>
                    View matches
                  </Link>
                </div>
              </div>
            ))}
            <Link href="/marketplace" style={{ display: "block", padding: "20px 24px", fontSize: 14, fontWeight: 600, color: "#0d0d0d" }}>
              + Create a new alert
            </Link>
          </div>
        )}
      </section>

      <FooterGrid />
    </div>
  );
}
