import Link from "next/link";
import { HeroShell } from "@/components/HeroShell";
import { PageShell } from "@/components/PageShell";
import { Footer } from "@/components/Footer";
import { Card, LightCard, LinkButton, MonoLabel, Thumb } from "@/components/ui";
import {
  CREW_COUNT,
  FOUNDED_YEAR,
  PHONE,
  SERVICE_AREA_CITIES,
  SERVICES,
  TESTIMONIALS,
  YEARS_IN_METRO,
} from "@/lib/content";

export default function Home() {
  return (
    <PageShell>
      <HeroShell>
        <h1 className="font-display max-w-[560px] text-3xl sm:text-[40px] font-extrabold leading-[1.15] text-white mb-4">
          Des Moines metro&rsquo;s outdoor spaces, handled by one crew.
        </h1>
        <p className="max-w-[480px] text-sm text-muted mb-7">
          Serving Central Iowa since {FOUNDED_YEAR} — lawn care, landscaping and hardscape, and
          holiday lighting.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <LinkButton href="/design" variant="green" className="w-full sm:w-auto py-2.5 sm:py-2">
            Try the AI design tool
          </LinkButton>
          <LinkButton href="/contact" variant="outline" className="w-full sm:w-auto py-2.5 sm:py-2">
            Get a free quote
          </LinkButton>
        </div>
      </HeroShell>

      <div className="grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr] gap-3">
        <Card className="col-span-2 sm:col-span-1 flex items-center gap-4">
          <div className="flex-1">
            <p className="font-display font-extrabold text-base text-white mb-1.5">AI design assist</p>
            <p className="text-[13px] text-muted">
              Upload a photo, get a concept back — then talk to a real designer.
            </p>
          </div>
          <LinkButton href="/design" className="font-data whitespace-nowrap">
            start ›
          </LinkButton>
        </Card>
        <Card>
          <p className="font-data text-2xl sm:text-3xl text-signal m-0">{YEARS_IN_METRO}</p>
          <p className="text-xs text-muted mt-1.5 m-0">years in Des Moines metro</p>
        </Card>
        <Card>
          <p className="font-data text-2xl sm:text-3xl text-signal m-0">{CREW_COUNT}</p>
          <p className="text-xs text-muted mt-1.5 m-0">full-time crew</p>
        </Card>
      </div>

      <div id="services" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SERVICES.map((service) => (
          <Link key={service.slug} href={`/services/${service.slug}`}>
            <Card className="hover:brightness-110 transition-[filter] flex items-center gap-3 sm:block sm:gap-0">
              <span className="text-signal text-xl">{service.icon}</span>
              <div>
                <p className="font-display font-extrabold text-base text-white mt-0 sm:mt-3.5 mb-1.5">
                  {service.title}
                </p>
                <p className="text-[13px] text-muted m-0">{service.shortDesc}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-3">
        <Card>
          <MonoLabel className="mt-0">RECENT PROJECTS</MonoLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3.5">
            <Thumb />
            <Thumb className="hidden sm:block" />
            <Thumb className="hidden sm:block" />
            <Link href="/gallery" className="aspect-square rounded-lg bg-thumb flex items-center justify-center">
              <span className="font-data text-xs text-signal">view all</span>
            </Link>
          </div>
        </Card>
        <LightCard className="flex flex-col justify-between text-charcoal">
          <div>
            <MonoLabel className="mt-0 text-light-ink">INSTANT ESTIMATE</MonoLabel>
            <div className="rounded-md bg-white px-3.5 py-3 my-3 text-[13px] text-muted">
              Enter your address
            </div>
          </div>
          <LinkButton href="/contact" className="text-center">
            Get my estimate
          </LinkButton>
        </LightCard>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 rounded-xl bg-steel px-5 py-4 sm:px-6 sm:py-4.5">
        <span className="font-data text-xs text-muted">
          {SERVICE_AREA_CITIES.join(" · ").toUpperCase()}
        </span>
        <a href="tel:+15154433278" className="font-data text-xs text-signal">
          {PHONE}
        </a>
      </div>

      <Card>
        <MonoLabel className="mt-0">FROM THE NEIGHBORHOOD</MonoLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3.5">
          {TESTIMONIALS.map((t) => (
            <div key={t.city} className="rounded-lg bg-ink p-4">
              <p className="text-[13px] text-light-gray leading-relaxed mb-2.5">&ldquo;{t.quote}&rdquo;</p>
              <p className="font-data text-[11px] text-signal m-0">{t.city}</p>
            </div>
          ))}
        </div>
      </Card>

      <Footer />
    </PageShell>
  );
}
