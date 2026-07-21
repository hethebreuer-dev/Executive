"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FooterGrid } from "@/components/luft/Footer";

type ModelDef = {
  id: string;
  name: string;
  full: string;
  low: number;
  high: number;
  med: number;
  comps: number;
};

const MODELS: ModelDef[] = [
  { id: "swb", name: "911 SWB", full: "911 SWB (1965–1968)", low: 130, high: 285, med: 190, comps: 38 },
  { id: "lwb", name: "911 LWB", full: "911 LWB (1969–1973)", low: 108, high: 250, med: 168, comps: 61 },
  { id: "g", name: "911 G-Series", full: "911 G-Series (1974–1989)", low: 55, high: 185, med: 92, comps: 214 },
  { id: "930", name: "930 Turbo", full: "930 Turbo (1975–1989)", low: 112, high: 275, med: 165, comps: 47 },
  { id: "964", name: "964", full: "964 (1989–1994)", low: 68, high: 225, med: 120, comps: 96 },
  { id: "993", name: "993", full: "993 (1994–1998)", low: 88, high: 295, med: 156, comps: 133 },
];

const CONDITIONS: { id: string; mult: number }[] = [
  { id: "Concours", mult: 1.28 },
  { id: "Excellent", mult: 1.0 },
  { id: "Very Good", mult: 0.84 },
  { id: "Driver", mult: 0.68 },
  { id: "Project", mult: 0.42 },
];

const LABELS = ["The Car", "Condition", "Photos", "Contact", "Price"];

const fmtK = (n: number) => "$" + Math.round(n) + "k";

export default function SellPage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [refNo, setRefNo] = useState("");

  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [trans, setTrans] = useState("Manual");
  const [extColor, setExtColor] = useState("");
  const [vin, setVin] = useState("");
  const [matching, setMatching] = useState(true);
  const [condition, setCondition] = useState("Excellent");
  const [owners, setOwners] = useState("");
  const [serviceHistory, setServiceHistory] = useState("Full & documented");
  const [notes, setNotes] = useState("");
  const [issues, setIssues] = useState("");
  const [price, setPrice] = useState("");
  const [sellerType, setSellerType] = useState("Private");
  const [sellerName, setSellerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [contactMethod, setContactMethod] = useState("In-app messages");
  const [openToOffers, setOpenToOffers] = useState(true);

  const md = useMemo(() => MODELS.find((m) => m.id === model) || null, [model]);
  const cond = CONDITIONS.find((c) => c.id === condition) || { mult: 1 };
  const low = md ? md.low * cond.mult : null;
  const high = md ? md.high * cond.mult : null;
  const med = md ? md.med * cond.mult : null;
  const pk = useMemo(() => {
    const n = parseFloat(String(price).replace(/[^0-9.]/g, ""));
    return isNaN(n) ? null : n / 1000;
  }, [price]);

  const progressPct = submitted ? 100 : ((step + 1) / LABELS.length) * 100;

  // Price positioning
  let statusLabel = "Awaiting price";
  let statusNote = "Enter an asking price to see how it sits against sold comps.";
  let markerPct = 50;
  let statusFilled = false;
  if (md && pk != null && low != null && high != null) {
    markerPct = Math.max(2, Math.min(98, ((pk - low) / (high - low)) * 100));
    if (pk < low * 0.95) {
      statusLabel = "↓ Below market band";
      statusNote = "Priced to move — expect strong early interest and fast offers.";
      statusFilled = true;
    } else if (pk > high * 1.05) {
      statusLabel = "↑ Above market band";
      statusNote = "Achievable for an exceptional, well-documented example — expect a longer sale.";
      statusFilled = true;
    } else {
      statusLabel = "● Market-aligned";
      statusNote = "Right in the verified sold range for this spec and condition.";
      statusFilled = true;
    }
  } else if (md) {
    statusLabel = "Comp band ready";
    statusNote = "Add your asking price to position it against sold results.";
  }

  const priceDisplay = pk != null ? "$" + Math.round(pk * 1000).toLocaleString() : "Not set";
  const previewTitle = ((year ? year + " " : "") + (md ? md.name : "Your 911")).trim() || "Your 911";
  const previewSpecs = [mileage, trans, condition, extColor].filter(Boolean).join(" · ");

  const summary = [
    { label: "Model", value: md ? md.full : "—" },
    { label: "Year", value: year || "—" },
    { label: "Mileage", value: mileage || "—" },
    { label: "Transmission", value: trans },
    { label: "Colour", value: extColor || "—" },
    { label: "Condition", value: condition },
    { label: "Matching numbers", value: matching ? "Yes" : "No" },
    { label: "Service", value: serviceHistory },
    { label: "Seller", value: sellerType + (sellerName ? " · " + sellerName : "") },
    { label: "Location", value: location || "—" },
    { label: "Offers", value: openToOffers ? "Open to offers" : "Firm price" },
    { label: "Asking", value: priceDisplay },
  ];

  function submit() {
    setRefNo("LFT-" + Math.floor(100000 + Math.random() * 899999));
    setSubmitted(true);
  }

  const toggleRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: "100%",
    background: "#ffffff",
    border: "1px solid #d9d8d4",
    padding: "16px 18px",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "var(--font-libre-franklin), sans-serif",
  };
  const boxStyle = (on: boolean): React.CSSProperties => ({
    width: 22,
    height: 22,
    flex: "0 0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: on ? "#0d0d0d" : "#ffffff",
    color: on ? "#ffffff" : "transparent",
    fontSize: 13,
    border: on ? "1px solid #0d0d0d" : "1px solid #d9d8d4",
  });

  return (
    <div style={{ background: "#ffffff" }}>
      {/* INTRO */}
      <section className="luft-container" style={{ padding: "56px 40px 0" }}>
        <div className="lbl" style={{ color: "#0d0d0d" }}>
          Sell · Private &amp; Dealer
        </div>
        <h1 className="display luft-h1" style={{ fontWeight: 600, fontSize: 64, lineHeight: 0.96, textTransform: "uppercase", margin: "12px 0 14px" }}>
          List your
          <br />
          air-cooled 911
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.55, color: "#5e5e5a", maxWidth: 560 }}>
          Reach every serious air-cooled buyer in the country. We benchmark your
          car against verified sold comps as you go — so it lists at a price the
          market will actually meet.
        </p>
      </section>

      {/* STEPPER */}
      <section className="luft-container" style={{ padding: "40px 40px 0" }}>
        <div style={{ borderTop: "1px solid #0d0d0d", paddingTop: 20 }}>
          <div style={{ display: "flex", gap: 34, flexWrap: "wrap", alignItems: "center" }}>
            {LABELS.map((label, i) => {
              const state = submitted || i < step ? "done" : i === step ? "active" : "todo";
              const filled = state === "done" || state === "active";
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => !submitted && setStep(i)}
                  style={{ display: "flex", alignItems: "center", gap: 11, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}
                >
                  <span
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: 13,
                      flex: "0 0 auto",
                      background: filled ? "#0d0d0d" : "#ffffff",
                      color: filled ? "#ffffff" : "#adaca7",
                      border: filled ? "1px solid #0d0d0d" : "1px solid #d9d8d4",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-libre-franklin), sans-serif",
                      fontWeight: 600,
                      fontSize: 13,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: filled ? "#0d0d0d" : "#adaca7",
                    }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 20, height: 3, background: "#eceae6", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${progressPct}%`, background: "#0d0d0d", transition: "width .25s ease" }} />
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="luft-container" style={{ padding: "44px 40px 0" }}>
        {submitted ? (
          <div style={{ border: "1px solid #0d0d0d", padding: "64px 56px", maxWidth: 820 }}>
            <div className="lbl" style={{ color: "#0d0d0d" }}>
              Listing published
            </div>
            <h2 className="display" style={{ fontWeight: 600, fontSize: 46, lineHeight: 1, textTransform: "uppercase", margin: "14px 0 8px" }}>
              You&apos;re on the market.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "#5e5e5a", maxWidth: 520 }}>
              {previewTitle} is now live and priced against verified comps. Buyers
              can watch, message, and make offers immediately.
            </p>
            <div style={{ display: "flex", gap: 40, flexWrap: "wrap", margin: "32px 0 36px", borderTop: "1px solid #e6e5e2", borderBottom: "1px solid #e6e5e2", padding: "22px 0" }}>
              <SummaryStat label="Reference" value={refNo} />
              <SummaryStat label="Asking" value={priceDisplay} />
              <SummaryStat label="Comp position" value={statusLabel} />
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/listing/1" style={{ background: "#0d0d0d", color: "#ffffff", fontSize: 15, fontWeight: 600, padding: "15px 28px" }}>
                View your listing →
              </Link>
              <Link href="/marketplace" style={{ border: "1px solid #0d0d0d", fontSize: 15, fontWeight: 600, padding: "14px 26px" }}>
                Go to marketplace
              </Link>
            </div>
          </div>
        ) : (
          <div className="luft-grid-2" style={{ gridTemplateColumns: "1.5fr 1fr", gap: 56, alignItems: "start" }}>
            {/* FORM COLUMN */}
            <div>
              {step === 0 && (
                <>
                  <StepHead title="The car" sub="Start with the chassis. These fields set your comp set." />
                  <Labeled label="Model & generation">
                    <select className="luft-field" value={model} onChange={(e) => setModel(e.target.value)}>
                      <option value="">Select a model…</option>
                      {MODELS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </Labeled>
                  <TwoCol>
                    <Labeled label="Model year">
                      <input className="luft-field" value={year} onChange={(e) => setYear(e.target.value)} placeholder="1973" />
                    </Labeled>
                    <Labeled label="Mileage">
                      <input className="luft-field" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="72,400 mi" />
                    </Labeled>
                  </TwoCol>
                  <TwoCol>
                    <Labeled label="Transmission">
                      <select className="luft-field" value={trans} onChange={(e) => setTrans(e.target.value)}>
                        <option>Manual</option>
                        <option>Sportomatic</option>
                        <option>Tiptronic</option>
                      </select>
                    </Labeled>
                    <Labeled label="Exterior colour">
                      <input className="luft-field" value={extColor} onChange={(e) => setExtColor(e.target.value)} placeholder="Grand Prix White" />
                    </Labeled>
                  </TwoCol>
                  <Labeled label="VIN / chassis number" mb={24}>
                    <input
                      className="luft-field"
                      value={vin}
                      onChange={(e) => setVin(e.target.value)}
                      placeholder="911360xxxx"
                      style={{ fontFamily: "var(--font-jetbrains-mono), monospace", letterSpacing: "0.04em" }}
                    />
                  </Labeled>
                  <button type="button" onClick={() => setMatching((v) => !v)} style={toggleRow}>
                    <span style={boxStyle(matching)}>{matching ? "✓" : ""}</span>
                    <span style={{ textAlign: "left" }}>
                      <span style={{ display: "block", fontWeight: 600, fontSize: 15 }}>Matching-numbers car</span>
                      <span style={{ display: "block", fontSize: 13, color: "#8a8a85" }}>
                        Original engine &amp; transmission per the Kardex / COA
                      </span>
                    </span>
                  </button>
                </>
              )}

              {step === 1 && (
                <>
                  <StepHead title="Condition & history" sub="Be honest — buyers pay for provenance, and it sharpens your comp band." />
                  <div style={{ marginBottom: 26 }}>
                    <FieldLabel style={{ marginBottom: 10 }}>Overall condition</FieldLabel>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {CONDITIONS.map((c) => (
                        <ChoiceButton key={c.id} on={condition === c.id} onClick={() => setCondition(c.id)}>
                          {c.id}
                        </ChoiceButton>
                      ))}
                    </div>
                  </div>
                  <TwoCol>
                    <Labeled label="Owners from new">
                      <input className="luft-field" value={owners} onChange={(e) => setOwners(e.target.value)} placeholder="3" />
                    </Labeled>
                    <Labeled label="Service history">
                      <select className="luft-field" value={serviceHistory} onChange={(e) => setServiceHistory(e.target.value)}>
                        <option>Full &amp; documented</option>
                        <option>Partial records</option>
                        <option>Limited / unknown</option>
                      </select>
                    </Labeled>
                  </TwoCol>
                  <Labeled label="Notable work & restoration">
                    <textarea className="luft-field" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Engine rebuild at 68k by air-cooled specialist, refreshed suspension, respray in original colour…" />
                  </Labeled>
                  <Labeled label="Known issues / needs" mb={0}>
                    <textarea className="luft-field" rows={3} value={issues} onChange={(e) => setIssues(e.target.value)} placeholder="Minor oil weep at valve covers, driver's seat bolster wear…" />
                  </Labeled>
                </>
              )}

              {step === 2 && (
                <>
                  <StepHead title="Photos" sub="One confident 3/4 hero, then the detail. Drag images straight onto a frame." />
                  <div className="luft-hatch" style={{ position: "relative", width: "100%", height: 380, border: "1px solid #e6e5e2", marginBottom: 16 }}>
                    <PhotoCaption>Hero shot — 3/4 front profile, clean background</PhotoCaption>
                    <span className="mono" style={{ position: "absolute", top: 14, left: 14, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", background: "#0d0d0d", color: "#ffffff", padding: "5px 9px" }}>
                      Hero
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                    {["Interior", "Engine bay", "Underside / detail"].map((p) => (
                      <div key={p} className="luft-hatch" style={{ position: "relative", height: 150, border: "1px solid #e6e5e2" }}>
                        <PhotoCaption small>{p}</PhotoCaption>
                      </div>
                    ))}
                  </div>
                  <p className="mono" style={{ fontSize: 11, color: "#8a8a85", marginTop: 16 }}>
                    Tip · Listings with 8+ high-res photos sell 2.3× faster on LUFT.
                  </p>
                </>
              )}

              {step === 3 && (
                <>
                  <StepHead title="Contact details" sub="How buyers reach you. Only your name and location show publicly — messages route through LUFT." />
                  <div style={{ marginBottom: 26 }}>
                    <FieldLabel style={{ marginBottom: 10 }}>I&apos;m listing as</FieldLabel>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {["Private", "Dealer"].map((t) => (
                        <ChoiceButton key={t} on={sellerType === t} onClick={() => setSellerType(t)} wide>
                          {t}
                        </ChoiceButton>
                      ))}
                    </div>
                  </div>
                  <TwoCol>
                    <Labeled label="Name">
                      <input className="luft-field" value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder="Full name or dealership" />
                    </Labeled>
                    <Labeled label="Location">
                      <input className="luft-field" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" />
                    </Labeled>
                  </TwoCol>
                  <TwoCol>
                    <Labeled label="Email">
                      <input className="luft-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
                    </Labeled>
                    <Labeled label="Phone (optional)">
                      <input className="luft-field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 —" />
                    </Labeled>
                  </TwoCol>
                  <Labeled label="Preferred contact method" mb={0}>
                    <select className="luft-field" value={contactMethod} onChange={(e) => setContactMethod(e.target.value)}>
                      <option>In-app messages</option>
                      <option>Email</option>
                      <option>Phone</option>
                    </select>
                  </Labeled>
                </>
              )}

              {step === 4 && (
                <>
                  <StepHead title="Price & publish" sub="Set your ask against the live comp band on the right, then review." />
                  <Labeled label="Asking price (USD)">
                    <div style={{ display: "flex", alignItems: "center", border: "1px solid #d9d8d4", background: "#ffffff" }}>
                      <span className="mono" style={{ padding: "0 12px 0 14px", fontSize: 17, color: "#8a8a85" }}>
                        $
                      </span>
                      <input
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="165,000"
                        style={{ flex: 1, border: "none", background: "transparent", padding: "14px 14px 14px 0", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 17, color: "#0d0d0d", outline: "none" }}
                      />
                    </div>
                  </Labeled>
                  <button type="button" onClick={() => setOpenToOffers((v) => !v)} style={toggleRow}>
                    <span style={boxStyle(openToOffers)}>{openToOffers ? "✓" : ""}</span>
                    <span style={{ textAlign: "left" }}>
                      <span style={{ display: "block", fontWeight: 600, fontSize: 15 }}>Open to offers</span>
                      <span style={{ display: "block", fontSize: 13, color: "#8a8a85" }}>
                        Buyers can make an offer below your asking price
                      </span>
                    </span>
                  </button>
                  <div style={{ borderTop: "1px solid #0d0d0d", marginTop: 32, paddingTop: 22 }}>
                    <div className="lbl" style={{ marginBottom: 16, color: "#0d0d0d" }}>
                      Review your listing
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {summary.map((r) => (
                        <div key={r.label} style={{ display: "flex", justifyContent: "space-between", gap: 20, padding: "11px 0", borderBottom: "1px solid #eceae6" }}>
                          <span className="lbl" style={{ color: "#8a8a85" }}>
                            {r.label}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 500, textAlign: "right" }}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* NAV BUTTONS */}
              <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    style={{ border: "1px solid #0d0d0d", background: "#ffffff", fontSize: 15, fontWeight: 600, padding: "14px 26px", cursor: "pointer", fontFamily: "var(--font-libre-franklin), sans-serif" }}
                  >
                    ← Back
                  </button>
                )}
                {step === 4 ? (
                  <button
                    type="button"
                    onClick={submit}
                    style={{ background: "#0d0d0d", color: "#ffffff", fontSize: 15, fontWeight: 600, padding: "15px 30px", cursor: "pointer", border: "none", fontFamily: "var(--font-libre-franklin), sans-serif" }}
                  >
                    Publish listing →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.min(4, s + 1))}
                    style={{ background: "#0d0d0d", color: "#ffffff", fontSize: 15, fontWeight: 600, padding: "15px 30px", cursor: "pointer", border: "none", fontFamily: "var(--font-libre-franklin), sans-serif" }}
                  >
                    Continue →
                  </button>
                )}
              </div>
            </div>

            {/* SIDEBAR */}
            <aside className="luft-sticky-aside" style={{ position: "sticky", top: 96 }}>
              <div style={{ border: "1px solid #0d0d0d", padding: "26px 24px" }}>
                <div className="lbl" style={{ color: "#0d0d0d", marginBottom: 4 }}>
                  Live market comp
                </div>
                {md ? (
                  <>
                    <div className="display" style={{ fontWeight: 600, fontSize: 20, textTransform: "uppercase", lineHeight: 1.05, marginBottom: 2 }}>
                      {md.full}
                    </div>
                    <div style={{ fontSize: 13, color: "#8a8a85", marginBottom: 20 }}>
                      {condition} · {md.comps} verified sold comps
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                      <span className="lbl">Expected band</span>
                      <span className="mono" style={{ fontSize: 15, fontWeight: 500 }}>
                        {fmtK(low!)} – {fmtK(high!)}
                      </span>
                    </div>
                    <div style={{ height: 8, background: "#eceae6", position: "relative", margin: "14px 0 8px" }}>
                      <div style={{ position: "absolute", top: 0, bottom: 0, left: "18%", right: "18%", background: "#0d0d0d", opacity: 0.12 }} />
                      <div style={{ position: "absolute", top: "50%", left: `${markerPct}%`, transform: "translate(-50%,-50%)", width: 3, height: 20, background: "#0d0d0d" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                      <span className="mono" style={{ fontSize: 11, color: "#8a8a85" }}>
                        {fmtK(low!)}
                      </span>
                      <span className="mono" style={{ fontSize: 11, color: "#8a8a85" }}>
                        median {fmtK(med!)}
                      </span>
                      <span className="mono" style={{ fontSize: 11, color: "#8a8a85" }}>
                        {fmtK(high!)}
                      </span>
                    </div>
                    <div style={{ borderTop: "1px solid #e6e5e2", paddingTop: 16 }}>
                      <div
                        className="mono"
                        style={{
                          display: "inline-block",
                          fontSize: 11,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          padding: "6px 10px",
                          background: statusFilled ? "#0d0d0d" : "transparent",
                          color: statusFilled ? "#ffffff" : "#8a8a85",
                          border: statusFilled ? "none" : "1px solid #d9d8d4",
                        }}
                      >
                        {statusLabel}
                      </div>
                      <p style={{ fontSize: 13, lineHeight: 1.5, color: "#5e5e5a", marginTop: 10 }}>{statusNote}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 14, lineHeight: 1.55, color: "#5e5e5a", marginTop: 12 }}>
                      Select your model and condition and we&apos;ll price it against
                      real sold results — updated as you type.
                    </p>
                    <div style={{ height: 8, background: "#eceae6", margin: "20px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="mono" style={{ fontSize: 11, color: "#adaca7" }}>
                        $—
                      </span>
                      <span className="mono" style={{ fontSize: 11, color: "#adaca7" }}>
                        $—
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div style={{ border: "1px solid #e6e5e2", borderTop: "none", padding: "22px 24px", background: "#fafafa" }}>
                <div className="lbl" style={{ marginBottom: 12 }}>
                  Listing preview
                </div>
                <div className="display" style={{ fontWeight: 600, fontSize: 22, textTransform: "uppercase", lineHeight: 1, marginBottom: 6 }}>
                  {previewTitle}
                </div>
                <div style={{ fontSize: 13, color: "#5e5e5a", marginBottom: 14 }}>{previewSpecs}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid #e6e5e2", paddingTop: 12 }}>
                  <span className="lbl">Asking</span>
                  <span className="mono" style={{ fontSize: 18, fontWeight: 500 }}>
                    {priceDisplay}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>

      <FooterGrid />
    </div>
  );
}

function StepHead({ title, sub }: { title: string; sub: string }) {
  return (
    <>
      <h2 className="display" style={{ fontWeight: 600, fontSize: 30, textTransform: "uppercase", marginBottom: 6 }}>
        {title}
      </h2>
      <p style={{ fontSize: 15, color: "#8a8a85", marginBottom: 28 }}>{sub}</p>
    </>
  );
}

function FieldLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="lbl" style={{ color: "#0d0d0d", marginBottom: 8, ...style }}>
      {children}
    </div>
  );
}

function Labeled({
  label,
  children,
  mb = 22,
}: {
  label: string;
  children: React.ReactNode;
  mb?: number;
}) {
  return (
    <div style={{ marginBottom: mb }}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 22 }}>{children}</div>;
}

function ChoiceButton({
  on,
  onClick,
  children,
  wide,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: "var(--font-libre-franklin), sans-serif",
        fontSize: 14,
        fontWeight: 600,
        padding: wide ? "11px 22px" : "11px 18px",
        cursor: "pointer",
        background: on ? "#0d0d0d" : "#ffffff",
        color: on ? "#ffffff" : "#0d0d0d",
        border: on ? "1px solid #0d0d0d" : "1px solid #d9d8d4",
      }}
    >
      {children}
    </button>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="lbl" style={{ marginBottom: 6 }}>
        {label}
      </div>
      <div className="mono" style={{ fontSize: 18 }}>
        {value}
      </div>
    </div>
  );
}

function PhotoCaption({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 12, textAlign: "center" }}>
      <span className="mono" style={{ fontSize: small ? 10 : 12, color: "#a3a29d" }}>
        {children}
      </span>
    </div>
  );
}
