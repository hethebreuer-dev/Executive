import { site } from "@/data/site";

// Homepage contact footer (also the /#contact anchor target).
export function ContactFooter() {
  return (
    <footer
      id="contact"
      style={{
        padding: "70px var(--gutter)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 40,
        flexWrap: "wrap",
        scrollMarginTop: "var(--header-h)",
      }}
    >
      <h2
        style={{
          fontSize: "clamp(28px, 5vw, 40px)",
          fontWeight: 500,
          letterSpacing: "-0.015em",
          maxWidth: 680,
          textWrap: "pretty",
          margin: 0,
        }}
      >
        Open to design director roles and consulting engagements.
      </h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          fontSize: 16,
          color: "var(--text-muted)",
          textAlign: "right",
        }}
      >
        <a href={`mailto:${site.email}`}>{site.email}</a>
        <a href={site.phoneHref}>{site.phone}</a>
        <span>{site.location}</span>
        <span
          style={{ marginTop: 10, color: "var(--text-faint)", fontSize: 14 }}
        >
          <a href={site.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>{" "}
          ·{" "}
          <a href={site.resumePdf} target="_blank" rel="noopener noreferrer">
            Resume PDF
          </a>
        </span>
      </div>
    </footer>
  );
}
