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
  projectImages?: string[];
}[] = [
  {
    slug: "lawn-care",
    title: "Lawn care",
    shortDesc: "Mowing, fertilization, aeration — recurring and hands-off.",
    icon: "✂",
    eyebrow: "SERVICE",
    heroDesc:
      "Recurring mowing, fertilization, and aeration programs that keep your lawn healthy all season — no calls, no reminders needed.",
    projectImages: [
      "/images/gallery/lawn-care-mowing-treerow.jpg",
      "/images/gallery/lawn-care-crew-truck.jpg",
      "/images/gallery/lawn-care-spreader.jpg",
    ],
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
    projectImages: [
      "/images/gallery/hardscape-pool-patio-featured.jpg",
      "/images/gallery/hardscape-retaining-wall-patio.jpg",
      "/images/gallery/hardscape-outdoor-kitchen.jpg",
    ],
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
    projectImages: [
      "/images/gallery/holiday-lighting-house-wreaths.jpg",
      "/images/gallery/holiday-lighting-house-night.jpg",
      "/images/gallery/holiday-lighting-crew-trailer.jpg",
    ],
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
  image?: string;
  featured?: boolean;
};

// Real crew photography from the owner's photo library (spec section 8).
// Titles/cities and specs (sq ft, timelines) are still placeholders — swap
// in exact numbers once the owner confirms them per project.
export const GALLERY_PROJECTS: GalleryProject[] = [
  {
    title: "Lakefront patio & pool rebuild",
    category: "Patios & hardscape",
    specs: ["PAVER PATIO", "POOL DECK", "OUTDOOR LIVING"],
    image: "/images/gallery/hardscape-pool-patio-featured.jpg",
    featured: true,
  },
  {
    title: "Retaining wall & patio",
    category: "Retaining walls",
    specs: ["SEGMENTAL BLOCK WALL", "PAVER PATIO"],
    image: "/images/gallery/hardscape-retaining-wall-patio.jpg",
  },
  {
    title: "Paver walkway & entry steps",
    category: "Patios & hardscape",
    specs: ["PAVER WALKWAY", "STONE STEPS"],
    image: "/images/gallery/hardscape-paver-steps-walkway.jpg",
  },
  {
    title: "Outdoor kitchen",
    category: "Patios & hardscape",
    specs: ["GRILL ISLAND", "PIZZA OVEN"],
    image: "/images/gallery/hardscape-outdoor-kitchen.jpg",
  },
  {
    title: "Custom fire feature",
    category: "Patios & hardscape",
    specs: ["GAS FIRE BOWL", "STONE BASE"],
    image: "/images/gallery/hardscape-fire-bowl.jpg",
  },
  {
    title: "Backyard putting green",
    category: "Patios & hardscape",
    specs: ["SYNTHETIC TURF", "BOULDER BORDER"],
    image: "/images/gallery/landscaping-putting-green.jpg",
  },
  {
    title: "Lakefront hardscape rebuild",
    category: "Patios & hardscape",
    specs: ["FULL BACKYARD REBUILD", "RETAINING WALL"],
    image: "/images/gallery/hardscape-lakefront-aerial.jpg",
  },
  {
    title: "Recurring lawn maintenance",
    category: "Lawn care",
    specs: ["MOWING", "TRIMMING & EDGING"],
    image: "/images/gallery/lawn-care-mowing-treerow.jpg",
  },
  {
    title: "Fertilization & lawn care route",
    category: "Lawn care",
    specs: ["FERTILIZATION", "WEED CONTROL"],
    image: "/images/gallery/lawn-care-spreader.jpg",
  },
  {
    title: "Landscape lighting",
    category: "Lighting",
    specs: ["LOW VOLTAGE LED"],
  },
  {
    title: "Holiday lighting install",
    category: "Lighting",
    specs: ["ROOFLINE + PEAKS", "WREATHS"],
    image: "/images/gallery/holiday-lighting-house-wreaths.jpg",
  },
  {
    title: "Custom color holiday lighting",
    category: "Lighting",
    specs: ["ROOFLINE + PEAKS", "COLOR CHANGING"],
    image: "/images/gallery/holiday-lighting-colorful.jpg",
  },
];

// Placeholder — spec section 8: needs real Google/Facebook review copy,
// names, and neighborhoods before launch.
export const TESTIMONIALS = [
  { quote: "Real review copy goes here — pull from Google/Facebook.", city: "Waukee" },
  { quote: "Real review copy goes here — pull from Google/Facebook.", city: "Urbandale" },
  { quote: "Real review copy goes here — pull from Google/Facebook.", city: "Johnston" },
];
