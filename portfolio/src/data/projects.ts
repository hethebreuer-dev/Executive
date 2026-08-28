import type { Block, Category, Media, Project } from "./types";

// Secondary placeholder slot labels by lead category — used to build the
// default project-page block sequence for projects whose photography has not
// been wired yet. These render as the designed striped placeholders.
function secondarySlots(categories: Category[]): [string, string] {
  const lead = categories[0];
  if (lead === "brand") return ["IDENTITY", "APPLICATION"];
  if (lead === "digital") return ["SITE", "SCREENS"];
  return ["ON-FIGURE", "FLAT / DETAIL"];
}

// Default placeholder block sequence: a 16:9 key, a 4:5 pair, a 21:9 band.
// Captions are omitted here by design — images lead; captions are added only
// where they carry real information (the wired-image projects below).
function placeholderBlocks(categories: Category[]): Block[] {
  const [a, b] = secondarySlots(categories);
  return [
    { type: "wide", media: { slot: "KEY IMAGE — 2000×1125" } },
    { type: "pair", items: [{ slot: a }, { slot: b }] },
    { type: "ultrawide", media: { slot: "WIDE CAMPAIGN — 2100×900" } },
  ];
}

const img = (file: string, alt: string, position?: string): Media => ({
  src: `/projects/${file}`,
  alt,
  slot: "",
  position,
});

// Order follows the design's `order` array: this drives the homepage grid and
// the "Next project →" sequence (wrapping at the end).
export const projects: Project[] = [
  {
    slug: "turn-apparel",
    name: "Turn Apparel",
    order: 1,
    categories: ["apparel", "digital"],
    role: "Concept, design, development, production, website build",
    result:
      "Managed the apparel category A–Z, capsule collections through to the storefront.",
    year: "2022–",
    slot: "CAPSULE / SITE — 1600×2000",
    intro:
      "An apparel label owned end to end — concept and design through production, and the storefront that sells it. Capsule collections built A–Z.",
    rail: {
      role: "Concept, design, development, production, website build",
      client: "Turn Apparel",
      scope: "Capsule collections, production, e-commerce",
      year: "2022 — present",
    },
    blocks: placeholderBlocks(["apparel", "digital"]),
  },
  {
    slug: "daily-driven-exotics",
    name: "Daily Driven Exotics",
    order: 2,
    categories: ["apparel", "brand", "digital"],
    role: "Apparel design, graphic design, website, email campaigns",
    result: "Seasonal drop program for a global automotive media audience.",
    year: "2022–",
    slot: "APPAREL / GRAPHICS — 1600×2000",
    intro:
      "Apparel and graphic program for an automotive media brand with a global audience, extended into web and email.",
    rail: {
      role: "Apparel design, graphic design, website design, email campaigns",
      client: "Daily Driven Exotics",
      scope: "Seasonal drops, brand graphics, e-commerce, campaign creative",
      year: "2022 — present",
    },
    blocks: placeholderBlocks(["apparel", "brand", "digital"]),
  },
  {
    slug: "design-direction-mens",
    name: "Design Direction Men's",
    order: 3,
    categories: ["apparel"],
    role: "Private label design direction, men's",
    result: "Seasonal men's direction from concept through production.",
    year: "2013–22",
    slot: "LINE BOARDS — 1600×2000",
    intro:
      "Seasonal men's design direction for private-label programs, carried from concept and line boards through to production.",
    rail: {
      role: "Private label design direction, men's",
      client: "US and UK retailers (private label)",
      scope: "Trend, line boards, range planning, production",
      year: "2013 — 2022",
    },
    blocks: placeholderBlocks(["apparel"]),
  },
  {
    slug: "craft-and-commerce",
    name: "Craft & Commerce",
    order: 4,
    categories: ["apparel"],
    role: "Founder, design director",
    result:
      "Ten seasons; wholesale into Revolve and boutique retail, then adopted into private label.",
    year: "2013–22",
    slot: "LOOKBOOK / ON-FIGURE — 1600×2000",
    card: img("cc-16.avif", "Craft & Commerce lookbook"),
    intro:
      "A men's and women's label founded and directed across ten seasons — sold wholesale into Revolve and boutique retail, then adopted into private label after it proved on the floor.",
    rail: {
      role: "Founder, design director",
      client: "Craft & Commerce (own brand)",
      scope: "Ten-season men's and women's collections, wholesale, lookbook",
      year: "2013 — 2022",
    },
    blocks: [
      {
        type: "wide",
        media: img("cc-01.avif", "Craft & Commerce campaign"),
      },
      {
        type: "pair",
        items: [
          img("cc-2.avif", "Craft & Commerce on-figure"),
          img("cc-48.avif", "Craft & Commerce detail"),
        ],
      },
      {
        type: "caption",
        text: "Lookbook and on-figure — ten seasons of men's and women's.",
      },
      {
        type: "ultrawide",
        media: img("cc-0807.avif", "Craft & Commerce collection band"),
      },
      {
        type: "pair",
        items: [
          img("cc-52.avif", "Craft & Commerce look"),
          img("cc-16.avif", "Craft & Commerce look"),
        ],
      },
    ],
  },
  {
    slug: "design-direction-womens",
    name: "Design Direction Women's",
    order: 5,
    categories: ["apparel"],
    role: "Private label design direction, US and UK retailers",
    result:
      "Full lifecycle from trend boards to production tech packs; team of six.",
    year: "2013–22",
    slot: "BOARDS / RANGE PLAN — 1600×2000",
    intro:
      "Private-label women's design direction for US and UK retailers — the full lifecycle from trend boards to production tech packs, leading a team of six.",
    rail: {
      role: "Private label design direction, women's",
      client: "US and UK retailers (private label)",
      scope: "Trend, range planning, tech packs, team of six",
      year: "2013 — 2022",
    },
    blocks: placeholderBlocks(["apparel"]),
  },
  {
    slug: "monstermax",
    name: "Monstermax",
    order: 6,
    categories: ["apparel", "brand", "digital"],
    role: "Apparel design, graphic design, website design",
    result: "Merch program for Whistlin Diesel's Monstermax build.",
    year: "2023",
    slot: "MERCH / CAMPAIGN — 1600×2000",
    intro:
      "Merch program for Whistlin Diesel's Monstermax build — apparel and graphics through to the storefront.",
    rail: {
      role: "Apparel design, graphic design, website design",
      client: "Whistlin Diesel / Monstermax",
      scope: "Merch line, brand graphics, e-commerce",
      year: "2023",
    },
    blocks: placeholderBlocks(["apparel", "brand", "digital"]),
  },
  {
    slug: "courtney-burke",
    name: "Courtney Burke",
    order: 7,
    categories: ["brand", "digital"],
    role: "Design direction, logo design, website design",
    result: "Identity and digital storefront for a founder-led label.",
    year: "2023",
    slot: "IDENTITY / SITE — 1600×2000",
    intro:
      "Identity and digital storefront for a founder-led label — design direction from the logo out to the site.",
    rail: {
      role: "Design direction, logo design, website design",
      client: "Courtney Burke",
      scope: "Identity, art direction, e-commerce",
      year: "2023",
    },
    blocks: placeholderBlocks(["brand", "digital"]),
  },
  {
    slug: "iiko-clothing",
    name: "IIKO Clothing",
    order: 8,
    categories: ["apparel"],
    role: "Creative director",
    result:
      "100% recycled cotton and PET plastics — 640 gallons of water saved per t-shirt produced.",
    year: "",
    slot: "COLLECTION / PROCESS — 1600×2000",
    intro:
      "A sustainability capsule made from 100% recycled cotton and PET plastics — 640 gallons of water saved per t-shirt produced.",
    rail: {
      role: "Creative director",
      client: "IIKO Clothing",
      scope: "Recycled-material collection, process, direction",
      year: "—",
    },
    blocks: placeholderBlocks(["apparel"]),
  },
  {
    slug: "craft-and-commerce-womens",
    name: "Craft & Commerce Women's",
    order: 9,
    categories: ["apparel"],
    role: "Founder, design director, photographer",
    result:
      "Sold into boutique retail including Revolve; market proof led private label to outgrow the standalone brand.",
    year: "2013–22",
    slot: "LOOKBOOK — 1600×2000",
    intro:
      "The women's side of Craft & Commerce — founded, directed and photographed. Sold into boutique retail including Revolve, with market proof that led private label to outgrow the standalone brand.",
    rail: {
      role: "Founder, design director, photographer",
      client: "Craft & Commerce (own brand)",
      scope: "Women's collections, lookbook, photography, wholesale",
      year: "2013 — 2022",
    },
    blocks: placeholderBlocks(["apparel"]),
  },
  {
    slug: "lamb-and-flag",
    name: "Lamb & Flag",
    order: 10,
    categories: ["apparel", "brand"],
    role: "Design director, creative director, brand development",
    result:
      "Three retail stores and e-commerce launched; 35% sell-through increase in key categories.",
    year: "2011–13",
    slot: "RETAIL + COLLECTION — 1600×2000",
    card: img("lf-c.avif", "Lamb & Flag collection"),
    intro:
      "Men's and women's collections plus the retail concept for Lamb & Flag — three stores and e-commerce launched, with a 35% sell-through increase in key categories.",
    rail: {
      role: "Design director, creative director, brand development",
      client: "Lamb & Flag — Kellwood",
      scope: "Collections, retail concept, e-commerce, brand development",
      year: "2011 — 2013",
    },
    blocks: [
      {
        type: "wide",
        media: img("lf-2070.avif", "Lamb & Flag collection"),
      },
      {
        type: "pair",
        items: [
          img("lf-a.avif", "Lamb & Flag look"),
          img("lf-f.avif", "Lamb & Flag look"),
        ],
      },
      {
        type: "caption",
        text: "Retail concept and collection — three stores and e-commerce.",
      },
      {
        type: "ultrawide",
        media: img("lf-720.avif", "Lamb & Flag retail band"),
      },
      {
        type: "pair",
        items: [
          img("lf-0504.avif", "Lamb & Flag detail"),
          img("lf-c.avif", "Lamb & Flag collection"),
        ],
      },
    ],
  },
  {
    slug: "american-eagle-outfitters",
    name: "American Eagle Outfitters",
    order: 11,
    categories: ["apparel"],
    role: "Men's knit top designer",
    result: "Cads and tech packs for seasonal men's knit collections.",
    year: "2004–07",
    slot: "CADS / TECH PACK — 1600×2000",
    intro:
      "Seasonal men's knit collections for a national specialty retailer — cads and tech packs from concept through production handoff.",
    rail: {
      role: "Men's knit top designer",
      client: "American Eagle Outfitters",
      scope: "Seasonal men's knits, cads, tech packs",
      year: "2004 — 2007",
    },
    blocks: placeholderBlocks(["apparel"]),
  },
  {
    slug: "prepschool",
    name: "PrepSchool",
    order: 12,
    categories: ["apparel"],
    role: "Concept capsule, hand drawn and hand painted",
    result:
      "Ralph Lauren and American Eagle inspired capsule, drawn and painted by hand.",
    year: "—",
    slot: "HAND-PAINTED ARTWORK — 1600×2000",
    intro:
      "A personal concept capsule drawn and painted by hand — a study in the Ralph Lauren and American Eagle heritage aesthetic.",
    rail: {
      role: "Concept capsule, hand drawn and hand painted",
      client: "Personal",
      scope: "Hand-drawn and hand-painted artwork, concept capsule",
      year: "—",
    },
    blocks: placeholderBlocks(["apparel"]),
  },
  {
    slug: "ralph-lauren-kids",
    name: "Ralph Lauren Kids",
    order: 13,
    categories: ["apparel"],
    role: "Designer, Boy's knits",
    result: "Design capsules and presentation rigging within the Boy's division.",
    year: "2000–03",
    slot: "CAPSULE BOARDS / RIGGING — 1600×2000",
    intro:
      "Seasonal top collections within Ralph Lauren's Boy's division — design capsules and presentation rigging, holding the brand's signature aesthetic across delivery cycles.",
    rail: {
      role: "Designer, Boy's knits",
      client: "Ralph Lauren",
      scope: "Seasonal capsules, presentation rigging",
      year: "2000 — 2003",
    },
    blocks: placeholderBlocks(["apparel"]),
  },
  {
    slug: "refuse",
    name: "Refuse",
    order: 14,
    categories: ["apparel"],
    role: "Concept, design, development",
    result:
      "A capsule of renewed and re-used garments — reclaimed denim and jersey pieced into new bodies.",
    year: "",
    slot: "CAPSULE BOARDS — 1600×2000",
    intro:
      "A capsule of renewed and re-used garments — reclaimed denim and jersey pieced into new bodies. Concept, design and development.",
    rail: {
      role: "Concept, design, development",
      client: "Refuse",
      scope: "Reclaimed-material capsule, pattern, construction",
      year: "—",
    },
    blocks: placeholderBlocks(["apparel"]),
  },
  {
    slug: "seven-days-cocktail-co",
    name: "Seven Days Cocktail Co.",
    order: 15,
    categories: ["brand", "digital"],
    role: "Packaging design, website design + development",
    result: "Packaging system and direct-to-consumer storefront.",
    year: "2021",
    slot: "PACKAGING / SITE — 1600×2000",
    intro:
      "A packaging system and direct-to-consumer storefront for a cocktail brand — identity through to the site build.",
    rail: {
      role: "Packaging design, website design + development",
      client: "Seven Days Cocktail Co.",
      scope: "Packaging system, brand, e-commerce build",
      year: "2021",
    },
    blocks: placeholderBlocks(["brand", "digital"]),
  },
  {
    slug: "lemonade-tv",
    name: "Lemonade.tv",
    order: 16,
    categories: ["brand", "digital"],
    role: "Co-founder, creative director",
    result: "Brand and creative direction from launch.",
    year: "—",
    slot: "BRAND / PLATFORM — 1600×2000",
    intro:
      "Brand and creative direction for a media platform from launch, as co-founder.",
    rail: {
      role: "Co-founder, creative director",
      client: "Lemonade.tv",
      scope: "Brand, creative direction, platform",
      year: "—",
    },
    blocks: placeholderBlocks(["brand", "digital"]),
  },
];

// Homepage grid order.
export const projectsInOrder = [...projects].sort((a, b) => a.order - b.order);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/** The project after `slug` in grid order, wrapping around at the end. */
export function nextProject(slug: string): Project {
  const i = projectsInOrder.findIndex((p) => p.slug === slug);
  return projectsInOrder[(i + 1) % projectsInOrder.length];
}
