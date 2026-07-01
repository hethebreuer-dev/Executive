import Link from "next/link";
import { HeroShell } from "@/components/HeroShell";
import { PageShell } from "@/components/PageShell";
import { Footer } from "@/components/Footer";
import { Card, Eyebrow, LightCard, LinkButton, Thumb } from "@/components/ui";
import { SERVICES } from "@/lib/content";

export function ServiceTemplate({ service }: { service: (typeof SERVICES)[number] }) {
  return (
    <PageShell>
      <HeroShell compact>
        <Eyebrow>{service.eyebrow}</Eyebrow>
        <h1 className="font-display max-w-[480px] text-2xl sm:text-[30px] font-extrabold text-white mb-3">
          {service.title}
        </h1>
        <p className="max-w-[480px] text-[13px] sm:text-sm text-muted">{service.heroDesc}</p>
      </HeroShell>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {service.subServices.map((sub) => (
          <Card key={sub.title}>
            <span className="text-signal text-base sm:text-lg">{sub.icon}</span>
            <p className="font-display font-extrabold text-xs sm:text-[15px] text-white mt-2.5 sm:mt-3 mb-1 sm:mb-1.5">
              {sub.title}
            </p>
            <p className="text-[11px] sm:text-xs text-muted m-0 leading-snug">{sub.desc}</p>
          </Card>
        ))}
      </div>

      <Card>
        <Eyebrow className="mb-4">{service.stepsLabel}</Eyebrow>
        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-4">
          {service.steps.map((step, i) => (
            <div key={step.title} className="flex sm:block gap-3 items-baseline">
              <p className="font-data text-base sm:text-[22px] text-signal m-0 min-w-[22px] sm:mb-2">
                {String(i + 1).padStart(2, "0")}
              </p>
              <div>
                <p className="font-display font-extrabold text-xs sm:text-[13px] text-white mb-0.5 sm:mb-1.5">
                  {step.title}
                </p>
                <p className="text-[11px] sm:text-xs text-muted m-0 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <LightCard className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-charcoal">
        <div>
          <p className="font-display font-extrabold text-sm text-ink mb-1">Not sure what you want yet?</p>
          <p className="text-xs text-light-ink m-0">Upload a photo of your yard and see design concepts first.</p>
        </div>
        <LinkButton href="/design" className="font-data w-full sm:w-auto text-center">
          try it ›
        </LinkButton>
      </LightCard>

      <Card>
        <Eyebrow className="mt-0 mb-0">
          RECENT {service.title.toUpperCase()} PROJECTS
        </Eyebrow>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3.5">
          <Thumb />
          <Thumb className="hidden sm:block" />
          <Thumb className="hidden sm:block" />
          <Link href="/gallery" className="aspect-square rounded-lg bg-thumb flex items-center justify-center">
            <span className="font-data text-xs text-signal">view all</span>
          </Link>
        </div>
      </Card>

      <Footer />
    </PageShell>
  );
}
