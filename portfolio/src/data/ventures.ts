import { galleryCard } from "./gallery";
import type { Venture } from "./types";

// Non-fashion work — its own lane, and each venture has its own detail page
// showing the full folder.
const base: Omit<Venture, "media">[] = [
  {
    slug: "worksta-ai",
    name: "Worksta.ai",
    role: "Founder. Agentic AI platform — hire one or many AI employees that work alone or together.",
    slot: "PRODUCT UI",
    intro:
      "An agentic AI platform — hire one or many AI employees that work alone or together. Founder; product and brand design end to end.",
    rail: {
      role: "Founder, product & brand design",
      focus: "Agentic AI platform, product UI, brand",
      year: "2024 —",
    },
    caption: "Your AI team, on demand — product and brand for an agentic AI platform.",
  },
  {
    slug: "happie-mushrooms",
    name: "Happie Mushrooms",
    role: "Founder. CPG supplement brand — packaging, identity, DTC.",
    slot: "PACKAGING",
    intro:
      "A CPG functional-mushroom supplement brand — packaging, identity and direct-to-consumer. Founder and creative director.",
    rail: {
      role: "Founder, creative director",
      focus: "Packaging, identity, DTC",
      year: "2023 —",
    },
    caption: "Packaging, identity and DTC for a functional-mushroom supplement brand.",
  },
  {
    slug: "breuer00-porsche",
    name: "Breuer00 Porsche",
    role: "Design development and restoration of a Porsche 911.",
    slot: "BUILD PHOTOGRAPHY",
    intro:
      "Design development and restoration of an air-cooled Porsche 911 — a personal build, from concept renders through to the finished car.",
    rail: {
      role: "Design, build direction",
      focus: "Restomod 911 — design development, restoration",
      year: "—",
    },
    caption: "From concept renders to the finished car — a personal 911 build.",
  },
];

export const ventures: Venture[] = base.map((v) => ({
  ...v,
  media: galleryCard(v.slug, v.name),
}));

export function getVenture(slug: string): Venture | undefined {
  return ventures.find((v) => v.slug === slug);
}

/** The venture after `slug`, wrapping around. */
export function nextVenture(slug: string): Venture {
  const i = ventures.findIndex((v) => v.slug === slug);
  return ventures[(i + 1) % ventures.length];
}
