// Typed content model. All portfolio copy lives in data files (this dir), not
// in JSX — the project list changes often. Presentation reads these at build
// time. Roles, results, years and resume copy are treated as final per the
// design handoff.

export type Category = "apparel" | "brand" | "digital";

export const CATEGORY_LABELS: Record<Category, string> = {
  apparel: "Apparel",
  brand: "Brand & graphic",
  digital: "Digital",
};

/** One image, or a designed placeholder when the photography isn't wired yet. */
export type Media = {
  /** Public path, e.g. "/projects/cc-16.avif". Omit for the placeholder state. */
  src?: string;
  /** Intrinsic dimensions (for natural-aspect plate blocks). */
  w?: number;
  h?: number;
  /** object-position override; defaults to center. */
  position?: string;
  /** Mono slot label shown in the placeholder state. */
  slot: string;
  /** Alt text when an image is present. */
  alt?: string;
};

/**
 * Repeatable block vocabulary for a project page — sequence varies per project.
 * `wide`/`pair`/`ultrawide` are fixed-ratio cover frames (good for photography);
 * `plate` shows one image at its natural aspect with no crop (good for design
 * boards, tech flats and packaging); `duo` is two cover-cropped 4:5 images.
 */
export type Block =
  | { type: "wide"; media: Media } // 16:9 key image
  | { type: "pair"; items: [Media, Media] } // two 4:5 images
  | { type: "ultrawide"; media: Media } // 21:9 band
  | { type: "duo"; items: [Media, Media] } // two 4:5 images (alias of pair)
  | { type: "plate"; media: Media; maxW?: number } // one image, natural aspect
  | { type: "caption"; text: string };

export type Project = {
  slug: string;
  name: string;
  /** Grid order on the homepage (also drives next-project navigation). */
  order: number;
  categories: Category[];
  role: string;
  result: string;
  /** Empty when the client asked for no date on a given project. */
  year: string;
  /** Mono slot label for the card's placeholder state. */
  slot: string;
  /** Card thumbnail (4:5). Undefined → placeholder with the slot label. */
  card?: Media;

  // Project page ------------------------------------------------------------
  intro: string;
  rail: {
    role: string;
    client: string;
    scope: string;
    year: string;
  };
  blocks: Block[];
};

export type Venture = {
  slug: string;
  name: string;
  /** One-line role summary shown on the tile. */
  role: string;
  slot: string;
  media?: Media;
  // Detail page ------------------------------------------------------------
  intro: string;
  rail: {
    role: string;
    focus: string;
    year: string;
  };
  caption: string;
};

export type Job = {
  years: string;
  company: string;
  title: string;
  place: string;
  summary: string;
};
