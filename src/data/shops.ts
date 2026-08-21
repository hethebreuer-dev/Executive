// Air-cooled Porsche specialist shops across the US.
//
// This is a curated, human-verified seed list — every shop here is a real,
// documented air-cooled 911/912/930/964/993 specialist. Coordinates are
// city-level (accurate enough for a "near me" map); distances shown on the
// Shops page are therefore approximate to the shop's city.
//
// Growing this list is the whole point — add entries as we verify more shops.
// Keep it to genuine air-cooled specialists (independent restorers, engine
// builders, marque techs), not general European-car garages or franchised
// dealers.

export type Shop = {
  id: string;
  name: string;
  city: string;
  state: string; // USPS 2-letter
  lat: number;
  lng: number;
  website?: string;
  phone?: string;
  specialties: string[];
  blurb: string;
};

export const SHOPS: Shop[] = [
  // ---- California ----
  {
    id: "callas-rennsport",
    name: "Callas Rennsport",
    city: "Torrance",
    state: "CA",
    lat: 33.8358,
    lng: -118.3406,
    website: "https://www.callasrennsport.com/",
    specialties: ["Restoration", "Service", "Rare models"],
    blurb:
      "South Bay veterans servicing and restoring air-cooled Porsches since 1992 — including some of the marque's rarest cars.",
  },
  {
    id: "house-automotive",
    name: "HOUSE Automotive",
    city: "Pasadena",
    state: "CA",
    lat: 34.1478,
    lng: -118.1445,
    website: "https://houseautogroup.com/",
    specialties: ["Service", "Maintenance"],
    blurb:
      "Independent Porsche specialist with LA-area locations and decades of combined experience, from early 911s to modern cars.",
  },
  {
    id: "sublime-silver-lake",
    name: "Sublime",
    city: "Los Angeles",
    state: "CA",
    lat: 34.0869,
    lng: -118.2702,
    website: "https://www.sublimesilverlake.com/",
    specialties: ["Service", "Interior/Exterior refurb"],
    blurb:
      "Full-service independent Porsche garage in Silver Lake with deep air- and water-cooled experience and vintage refurbishment.",
  },
  {
    id: "cpr-classic",
    name: "CPR Classic",
    city: "Fallbrook",
    state: "CA",
    lat: 33.3764,
    lng: -117.2511,
    website: "https://www.cprclassic.com/",
    specialties: ["Restoration", "356 / early 911 / 912"],
    blurb:
      "California's Porsche restoration company — 40+ years of concours-level 356, early 911 and 912 air-cooled restoration.",
  },
  // ---- Pacific Northwest ----
  {
    id: "rothsport",
    name: "Rothsport Racing",
    city: "Sherwood",
    state: "OR",
    lat: 45.3565,
    lng: -122.8407,
    website: "https://rothsport.com/",
    specialties: ["Engine builds", "Race prep", "Restoration"],
    blurb:
      "Premier air-cooled 911 builder with three-plus decades of engine and transmission expertise and custom development work.",
  },
  {
    id: "traftons",
    name: "Trafton's Foreign Auto",
    city: "Portland",
    state: "OR",
    lat: 45.5152,
    lng: -122.6784,
    website: "https://www.traftonforeignauto.com/",
    specialties: ["Repair", "Engine rebuilds"],
    blurb:
      "Portland's go-to for air-cooled Porsche repair and rebuilds, specializing in the marque since 1978.",
  },
  {
    id: "steves-imports",
    name: "Steve's Imports",
    city: "Portland",
    state: "OR",
    lat: 45.5622,
    lng: -122.6587,
    website: "https://stevesimports.com/",
    specialties: ["356 / 911 overhauls", "Rewiring"],
    blurb:
      "Complete factory-spec overhauls on air-cooled 356 and 911 Porsches, including electrical diagnosis and rewiring.",
  },
  {
    id: "precision-motorworks",
    name: "Precision Motorworks",
    city: "Seattle",
    state: "WA",
    lat: 47.6062,
    lng: -122.3321,
    website: "https://precisionmotorworks.net/",
    specialties: ["Service", "Repair"],
    blurb:
      "Seattle independent offering dedicated air-cooled Porsche service and repair.",
  },
  // ---- Mountain / Southwest ----
  {
    id: "eisenbuds",
    name: "Eisenbud's Aircooled",
    city: "Denver",
    state: "CO",
    lat: 39.7392,
    lng: -104.9903,
    website: "https://eisenbudsaircooled.com/",
    specialties: ["Engine/gearbox rebuilds", "Carbs", "Dyno tuning"],
    blurb:
      "Denver shop dedicated to air-cooled 356, 911 and 912 — engine and gearbox rebuilds, carburetor tuning and dyno work.",
  },
  {
    id: "avalon-motorsports",
    name: "Avalon Motorsports",
    city: "Denver",
    state: "CO",
    lat: 39.7286,
    lng: -104.9231,
    website: "https://www.avalonmotorsports.com/porsche/",
    specialties: ["Service", "Vintage to modern"],
    blurb:
      "Denver Porsche specialist covering everything from air-cooled vintage models to current cars.",
  },
  {
    id: "patrick-motorsports",
    name: "Patrick Motorsports",
    city: "Phoenix",
    state: "AZ",
    lat: 33.4484,
    lng: -112.074,
    website: "https://patrickmotorsports.com/",
    specialties: ["Parts", "Conversions", "Restoration"],
    blurb:
      "Air-cooled 911/914/930/964/993 parts, engine conversions, service and restoration specialists since 1989.",
  },
  {
    id: "reno-rennsport",
    name: "Reno Rennsport",
    city: "Reno",
    state: "NV",
    lat: 39.5296,
    lng: -119.8138,
    website: "https://aircooledenginebuilders.com/",
    specialties: ["Engine building", "356 / 911 / 930"],
    blurb:
      "Dedicated air-cooled Porsche engine-building specialist for 356, 911 and 930 flat-sixes.",
  },
  // ---- Texas ----
  {
    id: "rennsport-porsche-works",
    name: "Rennsport Porsche Works",
    city: "Sealy",
    state: "TX",
    lat: 29.7822,
    lng: -96.1572,
    website: "https://rennsportporsche.com/",
    specialties: ["Service", "Restoration"],
    blurb:
      "Founded in 1978 and still in Sealy, TX — mechanics with a combined 70 years of air-cooled Porsche experience.",
  },
  // ---- Midwest ----
  {
    id: "olsen-motorsport",
    name: "Olsen Motorsport",
    city: "Downers Grove",
    state: "IL",
    lat: 41.8089,
    lng: -88.0112,
    website: "https://olsenmotorsport.com/",
    specialties: ["Restoration", "Service", "Flat-six"],
    blurb:
      "Chicago-area specialist focused on air-cooled Porsches, primarily the classic flat-six platforms.",
  },
  {
    id: "edelweiss-autowerks",
    name: "Edelweiss Autowerks",
    city: "Madison",
    state: "WI",
    lat: 43.0731,
    lng: -89.4012,
    website: "https://www.edelweissmadison.com/air-cooled-porsche-911-repair-madison",
    specialties: ["Repair", "Early 911 / 964 / 993"],
    blurb:
      "Madison's air-cooled 911 specialist, with decades of experience caring for early 911s, 964s and 993s.",
  },
  // ---- Southeast ----
  {
    id: "rs-motorwerks",
    name: "RS Motorwerks",
    city: "Atlanta",
    state: "GA",
    lat: 33.749,
    lng: -84.388,
    website: "https://rsmotorwerks.com/air-cooled-porsche-restoration/",
    phone: "(404) 275-9926",
    specialties: ["Restoration", "1965–1998"],
    blurb:
      "One-stop air-cooled Porsche restoration in Atlanta, covering 1965 cars through the 993 Turbo S.",
  },
  {
    id: "nine-auto-motion",
    name: "9 Auto Motion",
    city: "West Palm Beach",
    state: "FL",
    lat: 26.7153,
    lng: -80.0534,
    website: "https://www.9automotion.com/car-services/classic-porsche-restoration/",
    specialties: ["Restoration", "911"],
    blurb:
      "Palm Beach air-cooled 911 restoration led by Gordon Wardle, with four decades of 911 experience.",
  },
  {
    id: "nine-sport-motorwerks",
    name: "Nine Sport Motorwerks",
    city: "Orlando",
    state: "FL",
    lat: 28.5383,
    lng: -81.3792,
    website: "https://ninesportmotorwerks.com/pages/classic-and-aircooled-porsche-service",
    specialties: ["Service", "Repair", "Restoration"],
    blurb:
      "Central Florida shop specializing in classic and air-cooled Porsche service, repair and restoration.",
  },
  {
    id: "motoro-cars",
    name: "Motoro Cars",
    city: "Miami",
    state: "FL",
    lat: 25.7617,
    lng: -80.1918,
    website: "https://motorocars.com/vehicles/porsche",
    specialties: ["Service", "Repair"],
    blurb:
      "Miami independent with 35+ years across every Porsche, from the air-cooled 911 forward.",
  },
  // ---- Northeast ----
  {
    id: "formula-motorsports",
    name: "Formula Motorsports",
    city: "Long Island City",
    state: "NY",
    lat: 40.744,
    lng: -73.925,
    website: "https://www.formulamotorsports.com/porsche-engine-rebuild/",
    specialties: ["Engine rebuilds", "Gearbox rebuilds"],
    blurb:
      "New York specialist that rebuilds more original air-cooled engines and gearboxes than most independents in the US.",
  },
  {
    id: "gaswerks-garage",
    name: "Gaswerks Garage",
    city: "Paramus",
    state: "NJ",
    lat: 40.9445,
    lng: -74.0754,
    website: "https://www.gaswerksgarage.com/",
    specialties: ["Restoration", "Service", "Parts", "Sales"],
    blurb:
      "New Jersey shop specializing in restoration, service, parts, performance and sales of classic air-cooled Porsches.",
  },
];
