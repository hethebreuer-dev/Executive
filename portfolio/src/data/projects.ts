import { IMG, type ImgKey } from "./media";
import type { Block, Media, Project } from "./types";

// Photography wired from Hethe's supplied source folders, re-encoded to web
// AVIF (see _encode.mjs). `im` pulls the optimized file + intrinsic dimensions
// from the generated media map; `imgLegacy` references the design's own
// crop-checked frames for Craft & Commerce and Lamb & Flag.
const im = (key: ImgKey, alt: string, position?: string): Media => ({
  src: IMG[key].src,
  w: IMG[key].w,
  h: IMG[key].h,
  alt,
  position,
  slot: "",
});
const imgLegacy = (file: string, alt: string, position?: string): Media => ({
  src: `/projects/${file}`,
  alt,
  slot: "",
  position,
});

const cap = (text: string): Block => ({ type: "caption", text });
const duo = (a: Media, b: Media): Block => ({ type: "duo", items: [a, b] });
const plate = (media: Media, maxW?: number): Block => ({
  type: "plate",
  media,
  maxW,
});
const wide = (media: Media): Block => ({ type: "wide", media });
const ultra = (media: Media): Block => ({ type: "ultrawide", media });

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
    card: im("turn-card", "Turn Apparel retrovision campaign"),
    intro:
      "An apparel label owned end to end — concept and design through production, and the storefront that sells it. Capsule collections built A–Z.",
    rail: {
      role: "Concept, design, development, production, website build",
      client: "Turn Apparel",
      scope: "Capsule collections, production, e-commerce",
      year: "2022 — present",
    },
    blocks: [
      plate(im("turn-1", "Turn retrovision campaign")),
      duo(
        im("turn-2", "Turn hoodie front"),
        im("turn-3", "Turn hoodie back"),
      ),
      cap("Concept to storefront — capsules and the retrovision line."),
      duo(im("turn-4", "Turn cap"), im("turn-5", "Turn cap")),
      plate(im("turn-6", "Turn storefront"), 560),
    ],
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
    card: im("dde-card", "Daily Driven Exotics founder in DDE apparel"),
    intro:
      "Apparel and graphic program for an automotive media brand with a global audience, extended into web and email.",
    rail: {
      role: "Apparel design, graphic design, website design, email campaigns",
      client: "Daily Driven Exotics",
      scope: "Seasonal drops, brand graphics, e-commerce, campaign creative",
      year: "2022 — present",
    },
    blocks: [
      duo(im("dde-1", "DDE campaign"), im("dde-2", "DDE jacket graphic")),
      cap("Apparel and brand graphics for a global automotive audience."),
      duo(im("dde-3", "DDE racing hoodie"), im("dde-4", "DDE racing hoodie")),
      duo(im("dde-5", "DDE Compton Racing tee"), im("dde-6", "DDE jacket lineup")),
      plate(im("dde-7", "DDE e-commerce storefront")),
    ],
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
    card: im("ddm-card", "Men's design direction"),
    intro:
      "Seasonal men's design direction for private-label programs, carried from concept and line boards through to production.",
    rail: {
      role: "Private label design direction, men's",
      client: "US and UK retailers (private label)",
      scope: "Trend, line boards, range planning, production",
      year: "2013 — 2022",
    },
    blocks: [
      plate(im("ddm-1", "Men's mood board")),
      plate(im("ddm-2", "Men's line board")),
      cap("Seasonal men's direction — mood, line boards, range plans."),
      plate(im("ddm-3", "Men's range board")),
      plate(im("ddm-4", "Men's direction")),
    ],
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
    card: imgLegacy("cc-16.avif", "Craft & Commerce lookbook"),
    intro:
      "A men's and women's label founded and directed across ten seasons — sold wholesale into Revolve and boutique retail, then adopted into private label after it proved on the floor.",
    rail: {
      role: "Founder, design director",
      client: "Craft & Commerce (own brand)",
      scope: "Ten-season men's and women's collections, wholesale, lookbook",
      year: "2013 — 2022",
    },
    blocks: [
      wide(imgLegacy("cc-01.avif", "Craft & Commerce campaign")),
      {
        type: "pair",
        items: [
          imgLegacy("cc-2.avif", "Craft & Commerce on-figure"),
          imgLegacy("cc-48.avif", "Craft & Commerce detail"),
        ],
      },
      cap("Lookbook and on-figure — ten seasons of men's and women's."),
      ultra(imgLegacy("cc-0807.avif", "Craft & Commerce collection band")),
      {
        type: "pair",
        items: [
          imgLegacy("cc-52.avif", "Craft & Commerce look"),
          imgLegacy("cc-16.avif", "Craft & Commerce look"),
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
    card: im("ddw-card", "Women's design direction"),
    intro:
      "Private-label women's design direction for US and UK retailers — the full lifecycle from trend boards to production tech packs, leading a team of six.",
    rail: {
      role: "Private label design direction, women's",
      client: "US and UK retailers (private label)",
      scope: "Trend, range planning, tech packs, team of six",
      year: "2013 — 2022",
    },
    blocks: [
      plate(im("ddw-1", "Women's mood board")),
      cap("Trend boards to production tech packs — a team of six."),
      plate(im("ddw-2", "Women's mood board")),
      plate(im("ddw-3", "Women's range board")),
    ],
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
    card: im("mmx-card", "Monstermax BESTROY hoodie"),
    intro:
      "Merch program for Whistlin Diesel's Monstermax build — apparel and graphics through to the storefront.",
    rail: {
      role: "Apparel design, graphic design, website design",
      client: "Whistlin Diesel / Monstermax",
      scope: "Merch line, brand graphics, e-commerce",
      year: "2023",
    },
    blocks: [
      duo(im("mmx-1", "Monstermax campaign"), im("mmx-2", "Monstermax tee back")),
      cap("Merch and campaign for Whistlin Diesel's Monstermax build."),
      duo(im("mmx-3", "Monstermax campaign"), im("mmx-4", "Monstermax hoodie")),
      plate(im("mmx-5", "Monstermax storefront")),
    ],
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
    card: im("cb-card", "Courtney Burke campaign"),
    intro:
      "Identity and digital storefront for a founder-led label — design direction from the logo out to the site.",
    rail: {
      role: "Design direction, logo design, website design",
      client: "Courtney Burke",
      scope: "Identity, art direction, e-commerce",
      year: "2023",
    },
    blocks: [
      duo(im("cb-1", "Courtney Burke look"), im("cb-2", "Courtney Burke look")),
      cap("Design direction and identity for a founder-led label."),
      duo(im("cb-3", "Courtney Burke look"), im("cb-4", "Courtney Burke look")),
      duo(im("cb-5", "Courtney Burke site"), im("cb-6", "Courtney Burke identity")),
    ],
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
    card: im("iiko-card", "IIKO recycled-material process", "top"),
    intro:
      "A sustainability capsule made from 100% recycled cotton and PET plastics — 640 gallons of water saved per t-shirt produced.",
    rail: {
      role: "Creative director",
      client: "IIKO Clothing",
      scope: "Recycled-material collection, process, direction",
      year: "—",
    },
    blocks: [
      cap("From plastic bottles and cotton scraps to new yarn, fabric and finished garments — 640 gallons of water saved per t-shirt."),
      plate(im("iiko-card", "IIKO recycled-material process, bottle to garment"), 620),
    ],
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
    card: im("ccw-card", "Craft & Commerce Women's lookbook"),
    intro:
      "The women's side of Craft & Commerce — founded, directed and photographed. Sold into boutique retail including Revolve, with market proof that led private label to outgrow the standalone brand.",
    rail: {
      role: "Founder, design director, photographer",
      client: "Craft & Commerce (own brand)",
      scope: "Women's collections, lookbook, photography, wholesale",
      year: "2013 — 2022",
    },
    blocks: [
      duo(im("ccw-1", "C&C Women's look"), im("ccw-2", "C&C Women's look")),
      cap("Studio lookbook — sold into boutique retail including Revolve."),
      duo(im("ccw-3", "C&C Women's look"), im("ccw-4", "C&C Women's look")),
      duo(im("ccw-5", "C&C Women's look"), im("ccw-6", "C&C Women's look")),
    ],
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
    card: imgLegacy("lf-c.avif", "Lamb & Flag collection"),
    intro:
      "Men's and women's collections plus the retail concept for Lamb & Flag — three stores and e-commerce launched, with a 35% sell-through increase in key categories.",
    rail: {
      role: "Design director, creative director, brand development",
      client: "Lamb & Flag — Kellwood",
      scope: "Collections, retail concept, e-commerce, brand development",
      year: "2011 — 2013",
    },
    blocks: [
      wide(imgLegacy("lf-2070.avif", "Lamb & Flag collection")),
      {
        type: "pair",
        items: [
          imgLegacy("lf-a.avif", "Lamb & Flag look"),
          imgLegacy("lf-f.avif", "Lamb & Flag look"),
        ],
      },
      cap("Retail concept and collection — three stores and e-commerce."),
      ultra(imgLegacy("lf-720.avif", "Lamb & Flag retail band")),
      {
        type: "pair",
        items: [
          imgLegacy("lf-0504.avif", "Lamb & Flag detail"),
          imgLegacy("lf-c.avif", "Lamb & Flag collection"),
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
    card: im("aeo-card", "American Eagle Outfitters campaign"),
    intro:
      "Seasonal men's knit collections for a national specialty retailer — cads and tech packs from concept through production handoff.",
    rail: {
      role: "Men's knit top designer",
      client: "American Eagle Outfitters",
      scope: "Seasonal men's knits, cads, tech packs",
      year: "2004 — 2007",
    },
    blocks: [
      plate(im("aeo-1", "AEO men's knits line board")),
      plate(im("aeo-2", "AEO men's knits line board")),
      cap("Seasonal men's knits — cads and tech packs, concept through production."),
      duo(im("aeo-3", "AEO men's knit"), im("aeo-4", "AEO men's knit")),
      plate(im("aeo-5", "AEO men's knits line board")),
    ],
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
    card: im("prep-card", "PrepSchool hand-painted artwork"),
    intro:
      "A personal concept capsule drawn and painted by hand — a study in the Ralph Lauren and American Eagle heritage aesthetic.",
    rail: {
      role: "Concept capsule, hand drawn and hand painted",
      client: "Personal",
      scope: "Hand-drawn and hand-painted artwork, concept capsule",
      year: "—",
    },
    blocks: [
      duo(im("prep-1", "PrepSchool artwork"), im("prep-2", "PrepSchool artwork")),
      cap("Hand-drawn and hand-painted concept capsule."),
      duo(im("prep-3", "PrepSchool artwork"), im("prep-4", "PrepSchool artwork")),
      duo(im("prep-5", "PrepSchool artwork"), im("prep-6", "PrepSchool artwork")),
    ],
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
    card: im("rlk-card", "Polo Ralph Lauren Boy's rugby"),
    intro:
      "Seasonal top collections within Ralph Lauren's Boy's division — design capsules and presentation rigging, holding the brand's signature aesthetic across delivery cycles.",
    rail: {
      role: "Designer, Boy's knits",
      client: "Ralph Lauren",
      scope: "Seasonal capsules, presentation rigging",
      year: "2000 — 2003",
    },
    blocks: [
      plate(im("rlk-1", "Polo Ralph Lauren Boy's campaign")),
      cap("Design capsules and presentation rigging within the Boy's division."),
      plate(im("rlk-2", "Boy's division presentation rigging")),
      plate(im("rlk-3", "Boy's division merchandising")),
    ],
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
    card: im("ref-card", "Refuse capsule board", "left"),
    intro:
      "A capsule of renewed and re-used garments — reclaimed denim and jersey pieced into new bodies. Concept, design and development.",
    rail: {
      role: "Concept, design, development",
      client: "Refuse",
      scope: "Reclaimed-material capsule, pattern, construction",
      year: "—",
    },
    blocks: [
      plate(im("ref-1", "Refuse capsule board")),
      cap("Reclaimed denim and jersey pieced into new bodies."),
      plate(im("ref-2", "Refuse capsule board")),
      plate(im("ref-3", "Refuse capsule board")),
      plate(im("ref-4", "Refuse capsule board")),
    ],
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
    card: im("seven-card", "Seven Days Cocktail Co. packaging"),
    intro:
      "A packaging system and direct-to-consumer storefront for a cocktail brand — identity through to the site build.",
    rail: {
      role: "Packaging design, website design + development",
      client: "Seven Days Cocktail Co.",
      scope: "Packaging system, brand, e-commerce build",
      year: "2021",
    },
    blocks: [
      plate(im("seven-1", "Seven Days packaging")),
      cap("Packaging system and direct-to-consumer storefront."),
      plate(im("seven-2", "Seven Days storefront")),
    ],
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
    card: im("lem-card", "Lemonade.tv app"),
    intro:
      "Brand and creative direction for a media platform from launch, as co-founder.",
    rail: {
      role: "Co-founder, creative director",
      client: "Lemonade.tv",
      scope: "Brand, creative direction, platform",
      year: "—",
    },
    blocks: [
      duo(im("lem-1", "Lemonade.tv app"), im("lem-2", "Lemonade.tv app")),
      cap("Brand and creative direction for a media platform, from launch."),
      plate(im("lem-3", "Lemonade.tv platform UI")),
    ],
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
