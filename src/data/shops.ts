// Air-cooled Porsche specialist directory.
//
// The dataset lives in shops.data.json (generated from the LUFT shop research
// spreadsheet). Each shop is geocoded to city-level coordinates, so distances
// shown on the Shops page are approximate to the shop's city. `services` are
// normalized facets used for filtering; `verified` marks shops confirmed
// against a current source (others are directory/club leads).

import data from "./shops.data.json";

export type Shop = {
  id: string;
  name: string;
  city: string;
  state: string; // USPS 2-letter
  lat: number;
  lng: number;
  website?: string | null;
  phone?: string | null;
  services: string[];
  focus?: string | null;
  verified: boolean;
};

export const SHOPS: Shop[] = data as Shop[];

// Service facets for the filter UI, ordered by prevalence in the data.
export const SERVICES = [
  "Service & Repair",
  "Restoration",
  "Performance & Race",
  "Engine & Trans",
  "Body & Paint",
  "Parts",
  "Interior",
  "Machine work",
  "Sales & Consignment",
] as const;
