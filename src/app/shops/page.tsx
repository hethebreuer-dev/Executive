import type { Metadata } from "next";
import { ShopsClient } from "./ShopsClient";

export const metadata: Metadata = {
  title: "Shops Near Me — Air-Cooled Porsche Specialists | LUFT",
  description:
    "Find air-cooled Porsche specialists near you — restorers, engine builders, and marque techs for the 911, 912, 930, 964, and 993. Search by ZIP and see them on a map.",
};

export default function ShopsPage() {
  return <ShopsClient />;
}
