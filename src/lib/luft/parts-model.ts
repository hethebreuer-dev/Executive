// Parts marketplace — shared, client-safe types & constants (no server imports,
// so both the browse UI and the sell form can import it). The "category" is the
// car model the part fits, per the MVP spec.

export interface Part {
  id: string;
  title: string;
  description: string;
  model: string; // fitment: all | 912 | 911 | 930 | 964 | 993
  partNumber: string | null;
  price: number | null; // USD; null = "make an offer"
  photos: string[];
  sellerName: string | null;
  sellerEmail: string;
  sellerPhone: string | null;
  sellerContact: string | null;
  createdAt: string;
}

export const PART_MODELS: { key: string; label: string }[] = [
  { key: "all", label: "All / Multiple" },
  { key: "912", label: "912" },
  { key: "911", label: "911 · SC · Carrera" },
  { key: "930", label: "930 Turbo" },
  { key: "964", label: "964" },
  { key: "993", label: "993" },
];

export const partModelLabel = (k: string) =>
  PART_MODELS.find((m) => m.key === k)?.label ?? "All / Multiple";
