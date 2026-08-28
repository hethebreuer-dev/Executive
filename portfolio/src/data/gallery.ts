import { GALLERY, type Img } from "./media";
import type { Block, Media } from "./types";

// Shared gallery layout used by both project and venture detail pages. Each
// detail page shows its whole folder (GALLERY[slug], hero floated first),
// arranged automatically:
//   • portraits pair into 4:5 "duo" rows
//   • landscape images render full-width at natural aspect ("plate")
//   • very tall boards/infographics render width-capped and centered
// so a 4-image page and a 21-image page both read well.

export const mediaFrom = (o: Img, alt: string, position?: string): Media => ({
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

export function galleryOf(slug: string): Img[] {
  return GALLERY[slug] ?? [];
}

/** Hero/card frame for a slug (first gallery image), or undefined if empty. */
export function galleryCard(slug: string, alt: string, position?: string) {
  const first = galleryOf(slug)[0];
  return first ? mediaFrom(first, alt, position) : undefined;
}

export function autoBlocks(slug: string, name: string, caption: string): Block[] {
  const items = galleryOf(slug);
  const blocks: Block[] = [];
  let i = 0;
  while (i < items.length) {
    const a = items[i];
    if (isWide(a)) {
      blocks.push(plate(mediaFrom(a, name)));
      i += 1;
    } else if (isTall(a)) {
      blocks.push(plate(mediaFrom(a, name), 620));
      i += 1;
    } else {
      const b = items[i + 1];
      if (b && !isWide(b) && !isTall(b)) {
        blocks.push(duo(mediaFrom(a, name), mediaFrom(b, name)));
        i += 2;
      } else {
        blocks.push(plate(mediaFrom(a, name), 620));
        i += 1;
      }
    }
  }
  if (caption) {
    blocks.splice(blocks.length > 1 ? 1 : blocks.length, 0, cap(caption));
  }
  return blocks;
}
