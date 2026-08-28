import { IMG } from "./media";
import type { Venture } from "./types";

// Non-fashion work — deliberately in its own lane, not mixed into the main
// work grid.
export const ventures: Venture[] = [
  {
    name: "Worksta.ai",
    role: "Founder. Agentic AI platform — hire one or many AI employees that work alone or together.",
    slot: "PRODUCT UI",
    media: {
      src: IMG["venture-worksta"].src,
      w: IMG["venture-worksta"].w,
      h: IMG["venture-worksta"].h,
      alt: "Worksta.ai product",
      slot: "",
    },
  },
  {
    name: "Happie Mushrooms",
    role: "Founder. CPG supplement brand — packaging, identity, DTC.",
    slot: "PACKAGING",
    media: {
      src: IMG["venture-happie"].src,
      w: IMG["venture-happie"].w,
      h: IMG["venture-happie"].h,
      alt: "Happie Mushrooms packaging",
      slot: "",
    },
  },
  {
    name: "Breuer00 Porsche",
    role: "Design development and restoration of a Porsche 911.",
    slot: "BUILD PHOTOGRAPHY",
    media: {
      src: IMG["venture-breuer"].src,
      w: IMG["venture-breuer"].w,
      h: IMG["venture-breuer"].h,
      alt: "Breuer00 Porsche 911",
      slot: "",
    },
  },
];
