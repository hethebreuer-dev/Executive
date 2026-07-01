"use client";

import Image from "next/image";
import { useState } from "react";
import { Eyebrow } from "@/components/ui";
import { GALLERY_FILTERS, GALLERY_PROJECTS } from "@/lib/content";

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function GalleryGrid() {
  const [filter, setFilter] = useState<(typeof GALLERY_FILTERS)[number]>("All");

  const projects = GALLERY_PROJECTS.filter(
    (p) => filter === "All" || p.category === filter
  );
  const featured = projects.find((p) => p.featured) ?? projects[0];
  const rest = projects.filter((p) => p !== featured);

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
        {GALLERY_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cx(
              "whitespace-nowrap rounded-md px-4 py-2 text-xs sm:text-[13px] transition-colors",
              f === filter
                ? "bg-signal text-signal-ink font-medium"
                : "border-[0.5px] border-border-dim text-light-gray hover:border-white"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {featured && (
        <div className="overflow-hidden rounded-xl bg-steel">
          <div className="relative aspect-[16/9] sm:aspect-[16/6] bg-thumb">
            {featured.image && (
              <Image src={featured.image} alt={featured.title} fill className="object-cover" priority />
            )}
          </div>
          <div className="p-4 sm:p-5">
            <Eyebrow className="mb-1.5">
              FEATURED · {featured.category.toUpperCase()}
            </Eyebrow>
            <p className="font-display font-extrabold text-sm sm:text-base text-white mb-2.5">
              {featured.title}
            </p>
            <div className="flex gap-3 sm:gap-5 flex-wrap">
              {featured.specs.map((spec) => (
                <span key={spec} className="font-data text-[10px] sm:text-[11px] text-muted">
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {rest.map((project) => (
          <div key={project.title} className="overflow-hidden rounded-xl bg-steel">
            <div className="relative aspect-[4/3] bg-thumb">
              {project.image && (
                <Image src={project.image} alt={project.title} fill className="object-cover" />
              )}
            </div>
            <div className="p-3 sm:p-3.5">
              <p className="font-display font-extrabold text-[11px] sm:text-[13px] text-white mb-1">
                {project.title}
              </p>
              <p className="font-data text-[10px] sm:text-[11px] text-muted m-0">
                {project.specs.join(" · ")}
              </p>
            </div>
          </div>
        ))}
        <div className="aspect-[4/3] rounded-xl bg-steel flex items-center justify-center">
          <span className="font-data text-xs text-signal">load more ›</span>
        </div>
      </div>
    </>
  );
}
