import type { Metadata } from "next";
import Image from "next/image";
import { HeroShell } from "@/components/HeroShell";
import { PageShell } from "@/components/PageShell";
import { Footer } from "@/components/Footer";
import { AiDesignFlow } from "@/components/AiDesignFlow";
import { Card, Eyebrow, MonoLabel } from "@/components/ui";

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

      <Card className="mx-auto max-w-[420px] w-full">
        <Eyebrow className="mt-0 mb-1.5">EXAMPLE CONCEPT</Eyebrow>
        <p className="font-display font-extrabold text-base text-white mb-1">
          See what the tool can do
        </p>
        <p className="text-xs text-muted mb-4">
          A real before/after from a recent concept — upload your own yard to get one like it.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <MonoLabel className="mt-0 mb-1.5 text-subtle">BEFORE</MonoLabel>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-thumb">
              <Image
                src="/images/design/example-before.jpg"
                alt="Yard before AI design concept"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div>
            <MonoLabel className="mt-0 mb-1.5 text-signal">AFTER</MonoLabel>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border-[0.5px] border-signal bg-thumb">
              <Image
                src="/images/design/example-after.jpg"
                alt="AI-generated design concept"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Card>

      <Footer />
    </PageShell>
  );
}
