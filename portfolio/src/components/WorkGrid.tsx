"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Category, Project } from "@/data/types";
import { ProjectCard } from "./ProjectCard";

type Filter = "all" | Category;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "apparel", label: "Apparel" },
  { value: "brand", label: "Brand & graphic" },
  { value: "digital", label: "Digital" },
];

function isFilter(v: string | null): v is Filter {
  return v === "all" || v === "apparel" || v === "brand" || v === "digital";
}

export function WorkGrid({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const raw = params.get("filter");
  const active: Filter = isFilter(raw) ? raw : "all";

  const setFilter = useCallback(
    (next: Filter) => {
      const q = new URLSearchParams(params.toString());
      if (next === "all") q.delete("filter");
      else q.set("filter", next);
      const qs = q.toString();
      // Keep the filtered view linkable without jumping scroll position.
      router.replace(qs ? `${pathname}?${qs}#work` : `${pathname}#work`, {
        scroll: false,
      });
    },
    [params, pathname, router],
  );

  const shown =
    active === "all"
      ? projects
      : projects.filter((p) => p.categories.includes(active));

  return (
    <section
      id="work"
      style={{ scrollMarginTop: "var(--header-h)" }}
      aria-label="Selected work"
    >
      <div
        style={{
          padding: "64px var(--gutter) 20px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <h2
          style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-0.01em", margin: 0 }}
        >
          Selected work
        </h2>
        <div
          role="tablist"
          aria-label="Filter work"
          style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
        >
          {FILTERS.map((f) => {
            const on = f.value === active;
            return (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setFilter(f.value)}
                style={{
                  padding: "9px 18px",
                  borderRadius: 999,
                  fontSize: 13,
                  cursor: "pointer",
                  minHeight: 36,
                  fontFamily: "inherit",
                  background: on ? "var(--text)" : "transparent",
                  color: on ? "var(--on-light)" : "var(--text-muted)",
                  border: on
                    ? "1px solid var(--text)"
                    : "1px solid var(--border-pill-strong)",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        key={active}
        className="grid-fade"
        style={{
          padding: "28px var(--gutter) 64px",
          display: "grid",
          gridTemplateColumns: "repeat(var(--work-cols, 3), 1fr)",
          gap: "36px 28px",
        }}
      >
        {shown.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </section>
  );
}
