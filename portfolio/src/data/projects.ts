import { GALLERY, type Img } from "./media";
import type { Block, Media, Project } from "./types";

// Every project detail page showcases its ENTIRE folder (see _encode.mjs, which
// re-encodes each source folder to web AVIF and floats the hero frame first in
// GALLERY[slug]). Blocks are laid out automatically from that gallery:
//   • portraits pair into 4:5 "duo" rows
//   • landscape images render full-width at natural aspect ("plate")
//   • very tall boards/infographics render width-capped and centered
// so a project with 4 images and one with 21 both read well without a fixed
// template.

const M = (o: Img, alt: string, position?: string): Media => ({
  src: o.src,
  w: o.w,
  h: o.h,
  alt,
  position,
  slot: "",
});

const cap = (text: string): Block => ({ type: "caption", text });
const duo = (a: Media, b: Media): Block => ({ type: "duo", items: [a, b] });
const plate = (media: Media, maxW?: number): Block => ({
  type: "plate",
  media,
  maxW,
});

const isWide = (o: Img) => o.w / o.h >= 1.15;
const isTall = (o: Img) => o.h / o.w >= 1.6;

function autoBlocks(slug: string, name: string, caption: string): Block[] {
  const items = GALLERY[slug] ?? [];
  const blocks: Block[] = [];
  let i = 0;
  while (i < items.length) {
    const a = items[i];
    if (isWide(a)) {
      blocks.push(plate(M(a, name)));
      i += 1;
    } else if (isTall(a)) {
      blocks.push(plate(M(a, name), 620));
      i += 1;
    } else {
      const b = items[i + 1];
      if (b && !isWide(b) && !isTall(b)) {
        blocks.push(duo(M(a, name), M(b, name)));
        i += 2;
      } else {
        // A lone portrait reads best contained and centered, not full-bleed.
        blocks.push(plate(M(a, name), 620));
        i += 1;
      }
    }
  }
  // Caption sits just under the opening image(s).
  if (caption) blocks.splice(blocks.length > 1 ? 1 : blocks.length, 0, cap(caption));
  return blocks;
}

type Meta = Omit<Project, "card" | "blocks"> & { caption: string };

const meta: Meta[] = [
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
    caption: "Concept to storefront — capsules and the retrovision line.",
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
    caption: "Apparel and brand graphics for a global automotive audience.",
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
    caption: "Seasonal men's direction — mood, line boards, range plans.",
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
    intro:
      "A men's and women's label founded and directed across ten seasons — sold wholesale into Revolve and boutique retail, then adopted into private label after it proved on the floor.",
    rail: {
      role: "Founder, design director",
      client: "Craft & Commerce (own brand)",
      scope: "Ten-season men's and women's collections, wholesale, lookbook",
      year: "2013 — 2022",
    },
    caption: "Lookbook and on-figure — ten seasons of men's and women's.",
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
    caption: "Trend boards to production tech packs — a team of six.",
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
    caption: "Merch and campaign for Whistlin Diesel's Monstermax build.",
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
    caption: "Design direction and identity for a founder-led label.",
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
    caption: "100% recycled cotton and PET — 640 gallons of water saved per t-shirt.",
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
    caption: "Studio lookbook — sold into boutique retail including Revolve.",
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
    intro:
      "Men's and women's collections plus the retail concept for Lamb & Flag — three stores and e-commerce launched, with a 35% sell-through increase in key categories.",
    rail: {
      role: "Design director, creative director, brand development",
      client: "Lamb & Flag — Kellwood",
      scope: "Collections, retail concept, e-commerce, brand development",
      year: "2011 — 2013",
    },
    caption: "Retail concept and collection — three stores and e-commerce.",
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
    caption:
      "Seasonal men's knits — cads and tech packs, concept through production.",
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
    caption: "Hand-drawn and hand-painted concept capsule.",
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
    caption: "Design capsules and presentation rigging within the Boy's division.",
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
    caption: "Reclaimed denim and jersey pieced into new bodies.",
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
    caption: "Packaging system and direct-to-consumer storefront.",
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
    caption: "Brand and creative direction for a media platform, from launch.",
  },
];

export const projects: Project[] = meta.map((m) => {
  const gallery = GALLERY[m.slug] ?? [];
  const { caption, ...rest } = m;
  return {
    ...rest,
    card: gallery[0]
      ? M(gallery[0], m.name)
      : undefined,
    blocks: autoBlocks(m.slug, m.name, caption),
  };
});

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
