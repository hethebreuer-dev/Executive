import type { Metadata } from "next";
import { HeroShell } from "@/components/HeroShell";
import { PageShell } from "@/components/PageShell";
import { Footer } from "@/components/Footer";
import { AiDesignFlow } from "@/components/AiDesignFlow";

export const metadata: Metadata = {
  title: "AI Design Assist | Executive Outdoor Solutions",
  description: "Upload a photo of your yard and see a design concept in minutes.",
};

export default function DesignPage() {
  return (
    <PageShell>
      <HeroShell>
        <AiDesignFlow />
      </HeroShell>
      <Footer />
    </PageShell>
  );
}
