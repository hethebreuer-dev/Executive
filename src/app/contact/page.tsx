import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroShell } from "@/components/HeroShell";
import { PageShell } from "@/components/PageShell";
import { Footer } from "@/components/Footer";
import { ContactForm } from "@/components/ContactForm";
import { Eyebrow, MonoLabel } from "@/components/ui";
import { PHONE, PHONE_HREF, SERVICE_AREA_CITIES } from "@/lib/content";

export const metadata: Metadata = {
  title: "Get a Quote | Executive Outdoor Solutions",
  description: "Get in touch with Executive Outdoor Solutions for a free quote.",
};

export default function ContactPage() {
  return (
    <PageShell>
      <HeroShell compact>
        <Eyebrow>GET IN TOUCH</Eyebrow>
        <h1 className="font-display max-w-[480px] text-2xl sm:text-[30px] font-extrabold text-white mb-3">
          Get a free quote
        </h1>
        <p className="max-w-[480px] text-[13px] sm:text-sm text-muted">
          Tell us about your property and what you&rsquo;re looking for — we&rsquo;ll follow up to schedule a
          walkthrough.
        </p>
      </HeroShell>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-3">
        <div className="rounded-xl bg-ink p-5 sm:p-6 flex flex-col gap-4">
          <div>
            <MonoLabel className="mt-0 mb-1.5">CALL US</MonoLabel>
            <a href={PHONE_HREF} className="font-data text-lg text-signal">
              {PHONE}
            </a>
          </div>
          <div>
            <MonoLabel className="mt-0 mb-1.5">SERVICE AREA</MonoLabel>
            <p className="font-data text-xs text-muted m-0">{SERVICE_AREA_CITIES.join(" · ")}</p>
          </div>
        </div>

        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </div>

      <Footer />
    </PageShell>
  );
}
