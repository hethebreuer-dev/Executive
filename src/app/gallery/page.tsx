import type { Metadata } from "next";
import { HeroShell } from "@/components/HeroShell";
import { PageShell } from "@/components/PageShell";
import { Footer } from "@/components/Footer";
import { GalleryGrid } from "@/components/GalleryGrid";
import { Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "Recent Projects | Executive Outdoor Solutions",
  description: "Every project built by our own crew, start to finish — no subcontractors.",
};

export default function GalleryPage() {
  return (
    <PageShell>
      <HeroShell compact>
        <Eyebrow>PROOF OF WORK</Eyebrow>
        <h1 className="font-display text-2xl sm:text-[28px] font-extrabold text-white mb-2">
          Recent projects
        </h1>
        <p className="text-xs sm:text-[13px] text-muted m-0">
          Every project built by our own crew, start to finish — no subcontractors.
        </p>
      </HeroShell>

      <GalleryGrid />

      <Footer />
    </PageShell>
  );
}
