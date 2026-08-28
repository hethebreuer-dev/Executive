import type { Metadata } from "next";
import { Header } from "@/components/Header";
import {
  education,
  jobs,
  resumeSummary,
  skills,
  tools,
} from "@/data/resume";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Resume",
  description: resumeSummary,
};

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      className="font-mono"
      style={{
        fontSize: 11,
        letterSpacing: "0.14em",
        color: "var(--text-fainter)",
        paddingBottom: 18,
        borderBottom: "1px solid var(--border)",
      }}
    >
      {children}
    </div>
  );
}

export default function ResumePage() {
  return (
    <>
      <Header active="Resume" />
      <main className="resume-body">
        <aside
          className="rail"
          style={{ display: "flex", flexDirection: "column", gap: 28 }}
        >
          <h1
            style={{
              fontSize: 38,
              fontWeight: 500,
              letterSpacing: "-0.018em",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Resume
          </h1>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: "var(--text-muted)",
              margin: 0,
            }}
          >
            {resumeSummary}
          </p>
          <a
            href={site.resumePdf}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "13px 22px",
              borderRadius: 999,
              background: "var(--text)",
              color: "var(--on-light)",
              fontSize: 15,
              fontWeight: 500,
              width: "fit-content",
              minHeight: 44,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Download PDF
          </a>
          <div style={{ height: 1, background: "var(--border)" }} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              fontSize: 14,
              color: "var(--text-dim)",
            }}
          >
            <span>{site.location}</span>
            <a href={site.phoneHref}>{site.phone}</a>
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <a href={site.linkedin} target="_blank" rel="noopener noreferrer">
              {site.linkedinLabel}
            </a>
          </div>
          <div style={{ height: 1, background: "var(--border)" }} />
          <div>
            <div
              className="font-mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                color: "var(--text-fainter)",
              }}
            >
              TOOLS
            </div>
            <div
              style={{
                marginTop: 10,
                fontSize: 14,
                lineHeight: 1.7,
                color: "var(--text-muted)",
              }}
            >
              {tools}
            </div>
          </div>
        </aside>

        <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
          <section>
            <SectionLabel>EXPERIENCE</SectionLabel>
            {jobs.map((j) => (
              <div key={j.company + j.years} className="exp-row">
                <div
                  className="font-mono"
                  style={{ fontSize: 13, color: "var(--text-faint)" }}
                >
                  {j.years}
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div style={{ fontSize: 24, fontWeight: 500 }}>
                    {j.company}
                  </div>
                  <div style={{ fontSize: 15, color: "var(--text-dim)" }}>
                    {j.title} — {j.place}
                  </div>
                  <ul
                    style={{
                      margin: "2px 0 0",
                      paddingLeft: 20,
                      maxWidth: 720,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      listStyle: "none",
                    }}
                  >
                    {j.bullets.map((b, k) => (
                      <li
                        key={k}
                        style={{
                          position: "relative",
                          fontSize: 15,
                          lineHeight: 1.6,
                          color: "var(--text-strong-body)",
                        }}
                      >
                        <span
                          aria-hidden
                          style={{
                            position: "absolute",
                            left: -20,
                            color: "var(--text-faint)",
                          }}
                        >
                          —
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </section>

          <section>
            <SectionLabel>CORE COMPETENCIES</SectionLabel>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                paddingTop: 20,
              }}
            >
              {skills.map((s) => (
                <span
                  key={s}
                  style={{
                    fontSize: 14,
                    padding: "9px 16px",
                    border: "1px solid var(--border-pill)",
                    borderRadius: 999,
                    color: "var(--text-strong-body)",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </section>

          <section>
            <SectionLabel>EDUCATION</SectionLabel>
            <div
              style={{
                paddingTop: 20,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontSize: 16,
                lineHeight: 1.6,
                color: "var(--text-strong-body)",
              }}
            >
              {education.map((e) => (
                <div key={e}>{e}</div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
