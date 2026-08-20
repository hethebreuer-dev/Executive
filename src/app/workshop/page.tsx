"use client";

import { useMemo, useState } from "react";
import { FooterSimple } from "@/components/luft/Footer";
import { WorkshopChat } from "./WorkshopChat";

type Step = { title: string; desc: string; torque?: string };
type Job = {
  id: string;
  num: string;
  title: string;
  diff: string;
  time: string;
  era: string;
  pro: boolean;
  sub: string;
  tools: string[];
  steps: Step[];
};
type Category = { cat: string; jobs: Job[] };

const CATALOG: Category[] = [
  {
    cat: "Engine & Fuel",
    jobs: [
      {
        id: "valve", num: "014", title: "Valve Clearance", diff: "Intermediate", time: "~2 hr", era: "915 & 930 gearcase era", pro: false,
        sub: "2.7L & 3.0L flat-six · set cold, engine off, every 15,000 miles.",
        tools: ["13mm wrench", 'Feeler gauge 0.004"', "Valve cover gaskets", "Torque wrench", "Distributor wrench", "Shop light"],
        steps: [
          { title: "Let the engine cool fully", desc: "Clearances are set cold — at least 3 hours off, or first thing before startup. Checking warm reads tight and leads to burnt valves." },
          { title: "Pull the valve covers & rotate to TDC No. 1", desc: "Bar the engine over by the crank pulley until the TDC mark aligns with the case split. Confirm with the distributor rotor pointing at cylinder 1.", torque: "Crank pulley bolt 174 lb-ft on reassembly" },
          { title: "Check clearance with a feeler gauge", desc: "Intake and exhaust set to 0.004 in cold. The gauge should pass with light drag — a firm bind is too tight, a rattle is too loose." },
          { title: "Adjust the locknut & screw", desc: "Loosen the 13mm locknut, turn the adjuster to spec, then hold the adjuster while torquing the locknut so the setting does not walk.", torque: "Rocker locknut 18 lb-ft" },
          { title: "Rotate 180° and repeat around the firing order", desc: "Work the 1-6-2-4-3-5 order, rotating the crank between each cylinder pair. Re-verify No. 1 at the end." },
          { title: "Reseal and reinstall the covers", desc: "Fresh gaskets, clean sealing surfaces, and even nut torque prevent the classic air-cooled valve-cover weep.", torque: "Valve cover nuts 7 lb-ft" },
        ],
      },
      {
        id: "cis", num: "021", title: "CIS Injection Sync", diff: "Intermediate", time: "~1 hr", era: "K-Jetronic era", pro: false,
        sub: "Balance airflow and dial in cold-start enrichment on Bosch CIS.",
        tools: ["Synchrometer", "3mm allen", "CO meter", "Screwdriver set"],
        steps: [
          { title: "Warm to operating temperature", desc: "CIS mixture is set hot. Run to full temp so the warm-up regulator is fully open before measuring." },
          { title: "Balance the throttle bodies", desc: "Use a synchrometer across each stack and equalize airflow with the linkage before touching mixture." },
          { title: "Set mixture at the fuel distributor", desc: "Small 3mm allen adjustments only — an eighth-turn moves CO noticeably. Target 1.5% CO at idle.", torque: "Do not force the allen past the internal stop" },
          { title: "Verify cold-start behavior", desc: "Cold-start valve and thermo-time switch should fire only on a cold engine. Confirm clean catch and fast-idle drop-off." },
        ],
      },
      {
        id: "chain", num: "033", title: "Chain Tensioner Swap", diff: "Advanced", time: "~3 hr", era: "Pre-1984 idler", pro: true,
        sub: "Upgrade the failure-prone early hydraulic tensioners to Carrera-style units.",
        tools: ["Tensioner kit", "Ratchet set", "Pressure-fed lines", "Thread locker", "Torque wrench", "Drain pan"],
        steps: [
          { title: "Relieve pressure and remove the old tensioners", desc: "Work one bank at a time so the chains never lose guidance. Note shim stack orientation before removal." },
          { title: "Fit the Carrera-tensioner conversion", desc: "Prime the new units in oil before installing to avoid a dry startup rattle.", torque: "Tensioner mount bolts 15 lb-ft" },
          { title: "Connect the pressure-fed oil lines", desc: "Route and secure the external feed lines clear of the heat exchangers." },
          { title: "Prime, start, and verify", desc: "Crank without ignition to build pressure, then confirm a silent top end at idle." },
        ],
      },
      {
        id: "oilcooler", num: "041", title: "Oil Cooler Reseal", diff: "Intermediate", time: "~2 hr", era: "All air-cooled", pro: true,
        sub: "Address the front-fender cooler seep common to high-mileage cars.",
        tools: ["Seal kit", "Ratchet set", "Drain pan"],
        steps: [
          { title: "Drain and access the cooler", desc: "Position a wide pan; the serpentine cooler holds more oil than expected." },
          { title: "Replace the sealing rings", desc: "Never reuse the crush rings on the cooler unions.", torque: "Union nuts 30 lb-ft" },
          { title: "Refill and leak-check", desc: "Run to temp and inspect the fender area under load." },
        ],
      },
    ],
  },
  {
    cat: "Suspension & Steering",
    jobs: [
      {
        id: "torsion", num: "052", title: "Torsion Bar Rebuild", diff: "Advanced", time: "~5 hr", era: "901 & G-series", pro: true,
        sub: "Re-index ride height and refresh the rear torsion tube.",
        tools: ["Spring plate tool", "Angle finder", "Grease", "Torque wrench"],
        steps: [
          { title: "Support and unload the rear", desc: "The bars carry real energy — never work them under load." },
          { title: "Mark and remove the spring plates", desc: "Scribe the current index before disassembly so you have a baseline." },
          { title: "Re-index to target ride height", desc: "Each spline is roughly a fixed height step; measure to the fender lip.", torque: "Spring plate bolts 90 lb-ft" },
        ],
      },
      {
        id: "bushings", num: "058", title: "Bushings & Bump Steer", diff: "Intermediate", time: "~4 hr", era: "All air-cooled", pro: true,
        sub: "Restore steering precision with fresh bushings and geometry.",
        tools: ["Press", "Bushing kit", "Alignment gauge"],
        steps: [
          { title: "Inspect and press out old bushings", desc: "Look for cracked or collapsed rubber at the control arms." },
          { title: "Install and torque", desc: "Torque suspension pivots at ride height, not hanging.", torque: "Control arm 65 lb-ft" },
          { title: "Set alignment", desc: "Re-check toe and bump steer after any bushing work." },
        ],
      },
      {
        id: "rack", num: "061", title: "Steering Rack Reseal", diff: "Advanced", time: "~3 hr", era: "All air-cooled", pro: true,
        sub: "Stop rack seepage and restore a tight center feel.",
        tools: ["Seal kit", "Tie-rod tool"],
        steps: [
          { title: "Remove the rack", desc: "Mark tie-rod thread depth to preserve toe." },
          { title: "Reseal and reassemble", desc: "Use fresh lock plates on the inner tie rods." },
          { title: "Reinstall and align", desc: "Center the rack before reconnecting the coupler." },
        ],
      },
    ],
  },
  {
    cat: "Body & Trim",
    jobs: [
      {
        id: "targa", num: "072", title: "Targa Top Reseal", diff: "Beginner", time: "~1 hr", era: "Targa", pro: false,
        sub: "Cure the classic Targa wind noise and water leaks.",
        tools: ["Seal kit", "Adhesive", "Trim tool"],
        steps: [
          { title: "Remove old seals", desc: "Warm the adhesive to release cleanly." },
          { title: "Clean and bed new seals", desc: "Dry-fit the full run before committing adhesive." },
          { title: "Water-test", desc: "Hose the roofline and check the drains." },
        ],
      },
      {
        id: "whaletail", num: "074", title: "Whale Tail Refit", diff: "Beginner", time: "~1 hr", era: "930 & Carrera", pro: true,
        sub: "Refit or reseal the ducktail / whale-tail engine lid.",
        tools: ["Trim tool", "Gasket"],
        steps: [
          { title: "Align the lid", desc: "Check panel gaps before final torque." },
          { title: "Reseal the base gasket", desc: "A worn base gasket lets water into the deck." },
          { title: "Torque hinges", desc: "Even torque keeps the lid from twisting.", torque: "Hinge bolts 15 lb-ft" },
        ],
      },
      {
        id: "fuchs", num: "077", title: "Fuchs Wheel Refinish", diff: "Intermediate", time: "~6 hr", era: "All air-cooled", pro: true,
        sub: "Restore the polished-lip, anodized-center Fuchs finish.",
        tools: ["Masking", "Polish", "Anodize kit"],
        steps: [
          { title: "Strip and mask", desc: "Separate the polished lip from the painted center." },
          { title: "Polish the lip", desc: "Work up through grits to a mirror." },
          { title: "Refinish the center", desc: "Match the correct period anodized tone." },
        ],
      },
    ],
  },
  {
    cat: "Electrical",
    jobs: [
      {
        id: "cdi", num: "083", title: "CDI Box Diagnosis", diff: "Intermediate", time: "~1 hr", era: "CDI-equipped", pro: true,
        sub: "Diagnose the intermittent hot-restart CDI failure.",
        tools: ["Multimeter", "Spare CDI"],
        steps: [
          { title: "Confirm spark loss when hot", desc: "The classic symptom is a no-start once heat-soaked." },
          { title: "Test the box and coil", desc: "Swap-test with a known-good CDI to isolate." },
          { title: "Relocate for cooling", desc: "Move the box off the hot firewall zone." },
        ],
      },
      {
        id: "gauges", num: "088", title: "Gauge Cluster Rebuild", diff: "Advanced", time: "~4 hr", era: "All air-cooled", pro: true,
        sub: "Rebuild VDO gauges and fix dim or dead instruments.",
        tools: ["Soldering iron", "Bulb kit"],
        steps: [
          { title: "Remove the cluster", desc: "Disconnect the battery first — live gauge feeds." },
          { title: "Replace bulbs and clean grounds", desc: "Most gauge issues are ground or bulb, not the movement." },
          { title: "Reassemble and test", desc: "Bench-test each gauge before refitting." },
        ],
      },
    ],
  },
];

const AI_BY_CAT: Record<string, { q: string; a: string; prompts: string[] }> = {
  "Engine & Fuel": {
    q: "Why won’t my 3.2 idle smoothly once it’s warm?",
    a: "On a warm G50 3.2, a hunting idle is most often a leaking intake boot or a lazy idle-stabilizer valve. Start by spraying the intake boots with the engine running — a momentary rise means a vacuum leak. If the boots are tight, clean the idle air valve and confirm 12V at its connector. I can walk you through both checks for your specific 1985 chassis.",
    prompts: ["Warm idle hunts", "No hot restart", "Rough cold start"],
  },
  "Suspension & Steering": {
    q: "My G-series wanders on the highway — where do I start?",
    a: "Highway wander on a torsion-bar car is usually worn steering-rack mounts, tired tie-rod ends, or a rear toe that has drifted. Check for play at the coupler and tie rods first, then measure rear toe. I can flag which bushings on your chassis fail first.",
    prompts: ["Steering wander", "Clunk over bumps", "Set ride height"],
  },
  "Body & Trim": {
    q: "Water is pooling in my Targa footwell after rain.",
    a: "That is almost always blocked Targa drain tubes or a shrunken roof seal, not the roof itself. Clear the four drain channels first, then water-test the seal run. I can show you where the drains exit on your car.",
    prompts: ["Targa leak", "Wind noise", "Panel gap set"],
  },
  Electrical: {
    q: "Car dies when hot and won’t restart until it cools.",
    a: "Classic heat-soaked CDI or coil symptom. Carry a known-good CDI box and swap-test at the roadside — if it fires, relocate the box away from the firewall heat. I can list the exact connector pinout for your chassis.",
    prompts: ["Hot no-start", "Dim gauges", "Dead tach"],
  },
};

const CHASSIS_OPTIONS = [
  "1985 911 Carrera 3.2 (G-series)",
  "1973 911 Carrera RS 2.7 (901)",
  "1987 930 Turbo",
  "1994 964 Carrera 2",
  "1997 993 Carrera S",
];

export default function WorkshopPage() {
  const [active, setActive] = useState("valve");
  const [chassis, setChassis] = useState("");
  const [search, setSearch] = useState("");
  const [proSoon, setProSoon] = useState(false);

  // Filter the job browser by the search box — match title, summary, category,
  // era, and tool names; drop categories with no remaining jobs.
  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CATALOG;
    return CATALOG.map((grp) => ({
      ...grp,
      jobs: grp.jobs.filter((j) =>
        `${j.title} ${j.sub} ${grp.cat} ${j.era} ${j.tools.join(" ")}`.toLowerCase().includes(q)
      ),
    })).filter((grp) => grp.jobs.length > 0);
  }, [search]);

  const { job, cat } = useMemo(() => {
    let found: Job = CATALOG[0].jobs[0];
    let category = CATALOG[0].cat;
    for (const c of CATALOG) {
      for (const j of c.jobs) {
        if (j.id === active) {
          found = j;
          category = c.cat;
        }
      }
    }
    return { job: found, cat: category };
  }, [active]);

  const totalSteps = job.steps.length;
  const locked = job.pro;
  const visibleSteps = locked ? job.steps.slice(0, 2) : job.steps;
  const ai = AI_BY_CAT[cat];

  const chips = [
    { label: job.diff, filled: true },
    { label: job.time, filled: false },
    { label: job.tools.length + " tools", filled: false },
    { label: totalSteps + " steps", filled: false },
  ];

  return (
    <div style={{ background: "#ffffff" }}>
      {/* HERO */}
      <section className="luft-container" style={{ padding: "52px 40px 0" }}>
        <div className="luft-grid-2" style={{ gridTemplateColumns: "1.05fr 1fr", gap: 56, alignItems: "end" }}>
          <div>
            <div className="lbl" style={{ color: "#0d0d0d", fontSize: 11, letterSpacing: "0.24em" }}>
              Workshop · AI Service &amp; Restoration
            </div>
            <h1 className="display luft-h1" style={{ fontWeight: 600, fontSize: 64, lineHeight: 0.98, textTransform: "uppercase", marginTop: 14 }}>
              Fix it,
              <br />
              don&apos;t flip it.
            </h1>
            <p style={{ marginTop: 18, fontSize: 16, lineHeight: 1.55, color: "#5e5e5a", maxWidth: 520 }}>
              Pick a job or search one. We walk you through it torque-spec by
              torque-spec — written for the 901, G-series, 964, and 993 platforms
              specifically, not &quot;cars&quot; in general.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                marginTop: 30,
                borderTop: "1px solid #e6e5e2",
                borderBottom: "1px solid #e6e5e2",
                padding: "16px 0",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div className="lbl" style={{ marginBottom: 6 }}>
                  Your Garage
                </div>
                <div className="display" style={{ fontWeight: 500, fontSize: 20, textTransform: "uppercase" }}>
                  {chassis ? chassis.replace(/\s*\(.*\)$/, "") : "All air-cooled"}
                </div>
              </div>
              <select
                value={chassis}
                onChange={(e) => setChassis(e.target.value)}
                style={{
                  marginLeft: "auto",
                  border: "1px solid #e6e5e2",
                  background: "#fafafa",
                  padding: "9px 12px",
                  color: "#0d0d0d",
                  cursor: "pointer",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: 13,
                }}
              >
                <option value="">Select your chassis</option>
                {CHASSIS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ position: "relative", width: "100%", height: 440, border: "1px solid #e6e5e2", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/luft/restoration.jpg" alt="911 bodyshell restoration" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <span
              className="mono"
              style={{ position: "absolute", top: 16, left: 16, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", background: "#0d0d0d", color: "#ffffff", padding: "5px 9px" }}
            >
              Restoration
            </span>
          </div>
        </div>
      </section>

      {/* MAIN */}
      <div className="luft-container luft-grid-2" style={{ padding: "44px 40px 0", gridTemplateColumns: "320px 1fr", gap: 48, alignItems: "start" }}>
        {/* JOB BROWSER */}
        <aside className="luft-sticky-aside" style={{ position: "sticky", top: 96, alignSelf: "start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #e6e5e2", background: "#fafafa", padding: "12px 14px", marginBottom: 26 }}>
            <span className="mono" style={{ color: "#8a8a85" }}>
              ⌕
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search a job — e.g. valve adjustment…"
              aria-label="Search jobs"
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                width: "100%",
                fontSize: 13,
                color: "#0d0d0d",
                fontFamily: "var(--font-libre-franklin), sans-serif",
              }}
            />
          </div>
          {filteredCatalog.length === 0 && (
            <div style={{ fontSize: 13, color: "#8a8a85", lineHeight: 1.5, padding: "4px 2px 20px" }}>
              No jobs match &ldquo;{search.trim()}&rdquo;. Try &ldquo;valve&rdquo;, &ldquo;CIS&rdquo;, or &ldquo;Targa&rdquo;.
            </div>
          )}
          {filteredCatalog.map((grp) => (
            <div key={grp.cat} style={{ marginBottom: 24 }}>
              <div className="lbl" style={{ color: "#0d0d0d", paddingBottom: 12, borderBottom: "1px solid #0d0d0d" }}>
                {grp.cat}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {grp.jobs.map((j) => {
                  const on = j.id === active;
                  return (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => setActive(j.id)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        width: "100%",
                        textAlign: "left",
                        border: "none",
                        cursor: "pointer",
                        padding: "11px 12px",
                        fontFamily: "var(--font-libre-franklin), sans-serif",
                        fontSize: 14,
                        fontWeight: on ? 600 : 400,
                        background: on ? "#0d0d0d" : "transparent",
                        color: on ? "#ffffff" : "#3f3f3d",
                        borderBottom: "1px solid #f3f2f0",
                      }}
                    >
                      <span>{j.title}</span>
                      <span className="mono" style={{ fontSize: 10, color: on ? "#cfcfca" : j.pro ? "#0d0d0d" : "#adaca7" }}>
                        {j.pro ? "PRO" : "FREE"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* GUIDE */}
        <main>
          <div style={{ border: "1px solid #e6e5e2" }}>
            <div style={{ padding: "28px 32px", borderBottom: "1px solid #e6e5e2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="lbl" style={{ color: "#0d0d0d" }}>
                  Guide {job.num} · {cat}
                </span>
                <span className="lbl">{job.era}</span>
              </div>
              <h2 className="display" style={{ fontWeight: 600, fontSize: 36, textTransform: "uppercase", margin: "14px 0 8px" }}>
                {job.title}
              </h2>
              <p style={{ fontSize: 15, color: "#5e5e5a", lineHeight: 1.5 }}>{job.sub}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
                {chips.map((c, i) => (
                  <span
                    key={i}
                    className="mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      padding: "7px 12px",
                      background: c.filled ? "#0d0d0d" : "transparent",
                      color: c.filled ? "#ffffff" : "#0d0d0d",
                      border: c.filled ? "none" : "1px solid #e6e5e2",
                    }}
                  >
                    {c.label}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ padding: "22px 32px", borderBottom: "1px solid #e6e5e2", background: "#fafafa" }}>
              <div className="lbl" style={{ marginBottom: 12 }}>
                Tools &amp; parts
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {job.tools.map((t) => (
                  <span key={t} className="mono" style={{ fontSize: 11, border: "1px solid #e6e5e2", background: "#ffffff", padding: "6px 10px" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ padding: "8px 32px 12px" }}>
              {visibleSteps.map((s, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 16, padding: "24px 0", borderBottom: "1px solid #eeeeec" }}>
                  <span className="mono" style={{ fontSize: 14, color: "#0d0d0d", fontWeight: 500 }}>
                    0{i + 1}
                  </span>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 7 }}>{s.title}</h3>
                    <p style={{ fontSize: 15, lineHeight: 1.6, color: "#3f3f3d", maxWidth: 640 }}>{s.desc}</p>
                    {s.torque && (
                      <div className="mono" style={{ display: "inline-block", marginTop: 14, border: "1px dashed #adaca7", padding: "9px 13px", fontSize: 12, color: "#0d0d0d" }}>
                        ◆ {s.torque}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {locked && (
              <div style={{ margin: "0 32px 32px", border: "1px solid #0d0d0d", background: "#0d0d0d", color: "#ffffff", padding: "34px 32px", textAlign: "center" }}>
                <div className="lbl" style={{ color: "#cfcfca" }}>
                  LUFT Pro · $19 / month
                </div>
                <h3 className="display" style={{ fontWeight: 600, fontSize: 28, textTransform: "uppercase", margin: "12px 0 8px" }}>
                  Unlock the full multi-step guide
                </h3>
                <p style={{ fontSize: 14, color: "#b0afaa", maxWidth: 440, margin: "0 auto 22px", lineHeight: 1.55 }}>
                  Every remaining step, torque figure, factory diagram reference,
                  and unlimited AI diagnostics for your chassis.
                </p>
                {proSoon ? (
                  <div className="mono" style={{ display: "inline-block", color: "#ffffff", fontWeight: 600, fontSize: 14, padding: "14px 28px", border: "1px solid #ffffff" }}>
                    Coming soon
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setProSoon(true)}
                    style={{ display: "inline-block", background: "#ffffff", color: "#0d0d0d", fontWeight: 600, fontSize: 14, padding: "14px 28px", border: "none", cursor: "pointer", fontFamily: "var(--font-libre-franklin), sans-serif" }}
                  >
                    Start 7-day free trial →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* AI ASSISTANT */}
          <WorkshopChat chassis={chassis} suggestions={ai.prompts} />
        </main>
      </div>

      <FooterSimple />
    </div>
  );
}
