export const PHONE = "(515) 443-3278";
export const PHONE_HREF = "tel:+15154433278";
export const FOUNDED_YEAR = 2013;
export const YEARS_IN_METRO = new Date().getFullYear() - FOUNDED_YEAR;
export const CREW_COUNT = 30;

export const SERVICE_AREA_CITIES = [
  "Des Moines",
  "Waukee",
  "Urbandale",
  "Johnston",
  "Clive",
  "Adel",
];

export const NAV_LINKS = [
  { label: "Services", href: "/#services" },
  { label: "Gallery", href: "/gallery" },
  { label: "AI design", href: "/design" },
  { label: "Contact", href: "/contact" },
];

export type ServiceSlug = "lawn-care" | "landscaping-hardscape" | "holiday-lighting";

export const SERVICES: {
  slug: ServiceSlug;
  title: string;
  shortDesc: string;
  icon: string;
  eyebrow: string;
  heroDesc: string;
  subServices: { icon: string; title: string; desc: string }[];
  steps: { title: string; desc: string }[];
  stepsLabel: string;
}[] = [
  {
    slug: "lawn-care",
    title: "Lawn care",
    shortDesc: "Mowing, fertilization, aeration — recurring and hands-off.",
    icon: "✂",
    eyebrow: "SERVICE",
    heroDesc:
      "Recurring mowing, fertilization, and aeration programs that keep your lawn healthy all season — no calls, no reminders needed.",
    subServices: [
      { icon: "✂", title: "Mowing & trimming", desc: "Weekly or bi-weekly recurring visits, edged and cleaned up every time" },
      { icon: "◐", title: "Fertilization & weed control", desc: "Season-long treatment programs tailored to Iowa soil and climate" },
      { icon: "↟", title: "Aeration & overseeding", desc: "Fall core aeration and overseeding for thicker, healthier turf" },
      { icon: "✦", title: "Spring & fall cleanup", desc: "Leaf removal, bed cleanup, and seasonal prep" },
    ],
    stepsLabel: "WHAT'S INCLUDED IN A VISIT",
    steps: [
      { title: "Mow & edge", desc: "Full property mow with clean edging along beds and walks" },
      { title: "Trim & blow", desc: "Trimming around obstacles, all clippings cleared from hard surfaces" },
      { title: "Check & flag", desc: "Crew flags any lawn health issues for your next treatment" },
    ],
  },
  {
    slug: "landscaping-hardscape",
    title: "Landscaping & hardscape",
    shortDesc: "Patios, retaining walls, outdoor living — start to finish.",
    icon: "▦",
    eyebrow: "SERVICE",
    heroDesc:
      "Patios, retaining walls, outdoor living spaces, and landscape lighting — designed and built by one crew, start to finish.",
    subServices: [
      { icon: "▢", title: "Patios & outdoor living", desc: "Paver and natural stone patios, fire pits, outdoor kitchens" },
      { icon: "▤", title: "Retaining walls", desc: "Engineered walls for grading, terracing, and erosion control" },
      { icon: "✿", title: "Planting & design", desc: "Beds, borders, and low-maintenance Iowa-hardy plantings" },
      { icon: "✦", title: "Landscape lighting", desc: "Low-voltage LED lighting for paths, walls, and features" },
    ],
    stepsLabel: "HOW IT WORKS",
    steps: [
      { title: "Design", desc: "Walk your property, talk through options, share a concept" },
      { title: "Build", desc: "One crew handles the full project, start to finish" },
      { title: "Enjoy", desc: "Walkthrough, care guidance, and warranty on the work" },
    ],
  },
  {
    slug: "holiday-lighting",
    title: "Holiday lighting",
    shortDesc: "Install, removal, storage — no ladder required.",
    icon: "✦",
    eyebrow: "SERVICE",
    heroDesc:
      "Professional holiday lighting install, takedown, and off-season storage — no ladders, no tangled totes in your garage.",
    subServices: [
      { icon: "⌂", title: "Roofline lighting", desc: "Clean C9/mini-light roofline and gutter installs" },
      { icon: "✦", title: "Tree & shrub wrapping", desc: "Lighted trees, shrubs, and landscape features" },
      { icon: "▢", title: "Custom displays", desc: "Wreaths, garland, and walkway or driveway lighting" },
      { icon: "☐", title: "Off-season storage", desc: "We store your lights and reinstall them next season" },
    ],
    stepsLabel: "HOW IT WORKS",
    steps: [
      { title: "Install", desc: "Crew designs and installs your display before the season starts" },
      { title: "Enjoy", desc: "We handle bulb outages and repairs through the season" },
      { title: "Removal & storage", desc: "Takedown after the season, lights stored until next year" },
    ],
  },
];

export const STYLE_OPTIONS = ["Modern", "Natural", "Classic", "Low-maint"] as const;

export const GALLERY_FILTERS = [
  "All",
  "Patios & hardscape",
  "Retaining walls",
  "Lighting",
  "Lawn care",
] as const;

export type GalleryProject = {
  title: string;
  category: (typeof GALLERY_FILTERS)[number];
  specs: string[];
  featured?: boolean;
};

// Placeholder gallery data — spec section 8: needs real photography and specs
// from the owner's photo library before launch.
export const GALLERY_PROJECTS: GalleryProject[] = [
  {
    title: "Full backyard rebuild — Waukee",
    category: "Patios & hardscape",
    specs: ["820 SQ FT PATIO", "SEAT WALL + FIRE PIT", "6 WEEKS"],
    featured: true,
  },
  { title: "Retaining wall — Urbandale", category: "Retaining walls", specs: ["140 LIN FT", "4 FT TALL"] },
  { title: "Landscape lighting — Johnston", category: "Lighting", specs: ["18 FIXTURES", "LOW VOLTAGE"] },
  { title: "Paver walkway — Clive", category: "Patios & hardscape", specs: ["95 SQ FT", "2 WEEKS"] },
  { title: "Holiday lighting — West Des Moines", category: "Lighting", specs: ["ROOFLINE + TREES"] },
  { title: "Outdoor kitchen — Adel", category: "Patios & hardscape", specs: ["GRILL ISLAND + BAR"] },
];

// Placeholder — spec section 8: needs real Google/Facebook review copy,
// names, and neighborhoods before launch.
export const TESTIMONIALS = [
  { quote: "Real review copy goes here — pull from Google/Facebook.", city: "Waukee" },
  { quote: "Real review copy goes here — pull from Google/Facebook.", city: "Urbandale" },
  { quote: "Real review copy goes here — pull from Google/Facebook.", city: "Johnston" },
];
