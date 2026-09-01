import Image from "next/image";
import { Header } from "@/components/Header";
import s from "./anduril.module.css";
import { Reveal } from "./Reveal";

// Anduril soft-goods pitch — a single-scroll editorial concept. Copy is fixed
// from the handoff (§3); imagery is the designed capsules and the storefront
// mockups. No cart, no prices: this is a proposal, not a store.

const BAND = "100vw";
const HALF = "(max-width: 720px) 100vw, 50vw";
const CONTAIN = "(max-width: 1264px) 100vw, 1200px";

/**
 * A full-bleed banner that is art-directed by breakpoint: a tall portrait crop
 * on mobile, a wide banner on desktop (more of the subject in frame). The
 * browser downloads only the source its media query matches, so this needs a
 * native <picture>/<img> rather than next/image.
 */
function ArtBand({
  mobile,
  desktop,
  alt,
}: {
  mobile: string;
  desktop: string;
  alt: string;
}) {
  return (
    <div className={s.bandArt}>
      <picture>
        <source media="(min-width: 721px)" srcSet={desktop} />
        <img
          src={mobile}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={s.bandImgEl}
        />
      </picture>
    </div>
  );
}

export default function AndurilPitch() {
  return (
    <main className={s.page}>
      <Header minimal />

      {/* ============================ HERO ============================ */}
      <section className={s.hero}>
        <Image
          src="/anduril/hero.avif"
          alt="A figure in a black Anduril jacket walking a desert flight line, an autonomous aircraft behind"
          fill
          priority
          sizes={BAND}
          className={s.heroImg}
        />
        <div className={s.heroScrim} />
        <div className={s.scrollCue} aria-hidden>
          <span>SCROLL</span>
          <span className={s.scrollLine} />
        </div>
        <div className={s.heroInner}>
          <div className={s.wrap}>
            <p className={`${s.mono} ${s.heroEyebrow}`}>
              A soft goods concept for Anduril
            </p>
            <h1 className={`${s.display} ${s.h1}`}>
              The mission is serious. The merch doesn&rsquo;t have to be.
            </h1>
            <p className={s.heroSub}>
              Three capsule collections. One brand system. A concept for what
              Anduril soft goods could be.
            </p>
            <p className={`${s.mono} ${s.fine}`}>
              Concept. Not affiliated with Anduril Industries.
            </p>
          </div>
        </div>
      </section>

      {/* ========================= MANIFESTO ========================= */}
      <section className={`${s.section} ${s.manifesto}`}>
        <div className={s.wrap}>
          <Reveal className={s.reveal}>
            <div className={s.manifestoGrid}>
              <div className={s.rule} />
              <h2 className={`${s.display} ${s.manifestoH}`}>
                Right now, the best brand in defense is wearing printed blanks.
              </h2>
              <p className={s.manifestoBody}>
                Anduril turned hardware into objects of desire. Apparel is the
                one place that standard slips. gear.anduril.com is blank tees
                with a logo dropped on top. For a company that treats design as
                a strategic advantage, that&rsquo;s a gap worth closing. Not for
                revenue, but for the brand, the culture, and the people
                you&rsquo;re trying to recruit. Allegiance is worn.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================== CAPSULE 01 — LIFESTYLE ==================== */}
      <section className={`${s.section} ${s.capLight}`}>
        <div className={s.capHead}>
          <Reveal className={s.reveal}>
            <div className={s.capNum}>
              <span className={s.dot} />
              <span className={`${s.mono} ${s.capLabel}`}>
                Capsule 01 — The lifestyle line
              </span>
            </div>
            <h2 className={`${s.display} ${s.capH}`}>
              The side of Anduril that doesn&rsquo;t take itself too seriously.
            </h2>
            <p className={s.capBody}>
              California by way of the flight line. Graphic tees, floral
              hoodies, and run shorts: everyday pieces with hidden details and
              neon hits. Built for early mornings, late nights, and everything
              in between.
            </p>
          </Reveal>
        </div>

        <Reveal className={s.reveal}>
          <ArtBand
            mobile="/anduril/life-look.avif"
            desktop="/anduril/life-look-desktop.avif"
            alt="Model in a chartreuse floral Anduril hoodie and black run shorts"
          />
        </Reveal>

        <div className={s.wrap}>
          <Reveal className={`${s.reveal} ${s.mt}`}>
            <div className={s.twoUp}>
              <figure className={`${s.figure}`}>
                <div className={s.flatBox}>
                  <Image
                    src="/anduril/life-flat.avif"
                    alt="Floral hoodie in Anduril chartreuse, product view"
                    fill
                    sizes={HALF}
                    className={s.flatImg}
                  />
                </div>
                <figcaption className={`${s.mono} ${s.figCap}`}>
                  Floral Hoodie
                </figcaption>
              </figure>
              <figure className={`${s.figure}`}>
                <div className={s.flatBox}>
                  <Image
                    src="/anduril/life-flat2.avif"
                    alt="Run short in black with neon drawcord, product view"
                    fill
                    sizes={HALF}
                    className={s.flatImg}
                  />
                </div>
                <figcaption className={`${s.mono} ${s.figCap}`}>
                  Run Short
                </figcaption>
              </figure>
            </div>
          </Reveal>
        </div>

        <Reveal className={`${s.reveal} ${s.mt}`}>
          <ArtBand
            mobile="/anduril/life-look2.avif"
            desktop="/anduril/life-look2-desktop.avif"
            alt="Model in a white Anduril tee and black run shorts on a concrete flight line"
          />
        </Reveal>

        <div className={s.wrap}>
          <Reveal className={`${s.reveal} ${s.mt}`}>
            <figure className={s.figure}>
              <Image
                src="/anduril/mock-life.avif"
                alt="The lifestyle line, imagined as an Anduril storefront"
                width={1536}
                height={1024}
                sizes={CONTAIN}
                className={s.figImg}
              />
              <figcaption className={`${s.mono} ${s.figCap}`}>
                The concept, as a storefront.
              </figcaption>
            </figure>
          </Reveal>

          <Reveal className={`${s.reveal} ${s.mt}`}>
            <figure className={s.figure}>
              <Image
                src="/anduril/life-sheet.avif"
                alt="Build Fun, Build Freedom lifestyle line sheet — tees, hoodies and shorts"
                width={1800}
                height={1200}
                sizes={CONTAIN}
                className={s.figImg}
              />
              <figcaption className={`${s.mono} ${s.figCap}`}>
                Build Fun, Build Freedom — the lifestyle line sheet.
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* ==================== CAPSULE 02 — TACTICAL ==================== */}
      <section className={`${s.section} ${s.capDark}`}>
        <div className={s.capHead}>
          <Reveal className={s.reveal}>
            <div className={s.capNum}>
              <span className={`${s.dot} ${s.dotBeige}`} />
              <span className={`${s.mono} ${s.capLabel}`}>
                Capsule 02 — The tactical line
              </span>
            </div>
            <h2 className={`${s.display} ${s.capH}`}>
              Field to everyday, without the costume.
            </h2>
            <p className={s.capBody}>
              Real garment design: base layers, technical outerwear, functional
              pants, a desert camp shirt. Performance fabrics, purpose-built
              details, a coherent kit that stands next to 5.11 and wins on
              brand. Black and desert beige.
            </p>
          </Reveal>
        </div>

        <Reveal className={s.reveal}>
          <ArtBand
            mobile="/anduril/tac-look.avif"
            desktop="/anduril/tac-look-desktop.avif"
            alt="Model in a desert-print Anduril camp shirt on a flight line, aircraft behind"
          />
        </Reveal>

        <div className={s.wrap}>
          <Reveal className={`${s.reveal} ${s.mt}`}>
            <div className={s.twoUp}>
              <figure className={`${s.figure}`}>
                <div className={s.flatBox}>
                  <Image
                    src="/anduril/tac-flat.avif"
                    alt="Technical quarter-zip jacket in black, product view"
                    fill
                    sizes={HALF}
                    className={s.flatImg}
                  />
                </div>
                <figcaption className={`${s.mono} ${s.figCap}`}>
                  Technical Jacket
                </figcaption>
              </figure>
              <figure className={`${s.figure}`}>
                <div className={s.flatBox}>
                  <Image
                    src="/anduril/tac-flat2.avif"
                    alt="Desert-print camp shirt in beige, product view"
                    fill
                    sizes={HALF}
                    className={s.flatImg}
                  />
                </div>
                <figcaption className={`${s.mono} ${s.figCap}`}>
                  Lucky Palmer Shirt
                </figcaption>
              </figure>
            </div>
          </Reveal>

          <Reveal className={`${s.reveal} ${s.mt}`}>
            <figure className={s.figure}>
              <Image
                src="/anduril/mock-tac.avif"
                alt="The tactical line, imagined as an Anduril storefront"
                width={1536}
                height={1024}
                sizes={CONTAIN}
                className={s.figImg}
              />
              <figcaption className={`${s.mono} ${s.figCap}`}>
                The concept, as a storefront.
              </figcaption>
            </figure>
          </Reveal>

          <Reveal className={`${s.reveal} ${s.mt}`}>
            <figure className={s.figure}>
              <Image
                src="/anduril/tac-sheet.avif"
                alt="Built for Advantage tactical line sheet — base layers, outerwear and pants"
                width={1800}
                height={1200}
                sizes={CONTAIN}
                className={s.figImg}
              />
              <figcaption className={`${s.mono} ${s.figCap}`}>
                Built for Advantage — the tactical line sheet.
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* ==================== CAPSULE 03 — ANIME ==================== */}
      <section className={`${s.section} ${s.capDark}`}>
        <div className={s.capHead}>
          <Reveal className={s.reveal}>
            <div className={s.capNum}>
              <span className={`${s.dot} ${s.dotAmber}`} />
              <span className={`${s.mono} ${s.capLabel}`}>
                Capsule 03 — The anime line
              </span>
            </div>
            <h2 className={`${s.display} ${s.capH}`}>
              Anime inspired. Mission driven.
            </h2>
            <p className={s.capBody}>
              A limited drop that runs Anduril&rsquo;s world through an anime
              lens — Altius. Schematic aircraft, sunset skylines, and 常に前進
              (&ldquo;always advancing&rdquo;) across graphic tees, hoodies and a
              pilot cap. Built for those who never stand still.
            </p>
          </Reveal>
        </div>

        <Reveal className={s.reveal}>
          <ArtBand
            mobile="/anduril/anime-look.avif"
            desktop="/anduril/anime-look-desktop.avif"
            alt="Anime-style illustration of a figure in an Altius Anduril hoodie against a sunset skyline"
          />
        </Reveal>

        <div className={s.wrap}>
          <Reveal className={`${s.reveal} ${s.mt}`}>
            <div className={s.twoUp}>
              <figure className={s.figure}>
                <div className={s.flatBox}>
                  <Image
                    src="/anduril/anime-flat.avif"
                    alt="Altius Air Vector tee in black with a schematic aircraft graphic, product view"
                    fill
                    sizes={HALF}
                    className={s.flatImg}
                  />
                </div>
                <figcaption className={`${s.mono} ${s.figCap}`}>
                  Altius Air Vector Tee
                </figcaption>
              </figure>
              <figure className={s.figure}>
                <div className={s.flatBox}>
                  <Image
                    src="/anduril/anime-flat2.avif"
                    alt="Above All hoodie in olive with an anime sunset aircraft graphic, product view"
                    fill
                    sizes={HALF}
                    className={s.flatImg}
                  />
                </div>
                <figcaption className={`${s.mono} ${s.figCap}`}>
                  Above All Hoodie
                </figcaption>
              </figure>
            </div>
          </Reveal>

          <Reveal className={`${s.reveal} ${s.mt}`}>
            <figure className={s.figure}>
              <Image
                src="/anduril/mock-anime.avif"
                alt="The anime line, imagined as an Anduril storefront"
                width={1448}
                height={1086}
                sizes={CONTAIN}
                className={s.figImg}
              />
              <figcaption className={`${s.mono} ${s.figCap}`}>
                The concept, as a storefront.
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* ========================= WHY ME ========================= */}
      <section className={`${s.section} ${s.why}`}>
        <div className={s.wrap}>
          <Reveal className={s.reveal}>
            <h2 className={`${s.display} ${s.whyH}`}>
              I&rsquo;ve shipped this before.
            </h2>
            <p className={s.whyBody}>
              Twenty years of product that moved on the floor: men&rsquo;s and
              women&rsquo;s for national retail &mdash; Ralph Lauren, American
              Eagle Outfitters, PacSun &mdash; and private label for US and UK
              retailers. Plus the merch and Shopify/DTC operations for two of
              the largest enthusiast channels online, Daily Driven Exotics and
              Whistlin Diesel / MonsterMax. Same audience DNA as Anduril&rsquo;s.
              Concept to drop to doorstep, built end to end.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ========================= CTA ========================= */}
      <section className={`${s.section} ${s.cta}`}>
        <div className={s.wrap}>
          <Reveal className={s.reveal}>
            <h2 className={`${s.display} ${s.ctaH}`}>Let&rsquo;s build it for real.</h2>
            <p className={s.ctaBody}>
              A conversation, then a pilot drop built to Anduril&rsquo;s
              standard.
            </p>
            <a
              className={s.ctaBtn}
              href="mailto:hethebreuer@gmail.com?subject=Anduril%20soft%20goods%20%E2%80%94%20let%27s%20talk"
            >
              Start the conversation
              <span aria-hidden>&rarr;</span>
            </a>
          </Reveal>
        </div>
      </section>

      {/* ========================= FOOTER ========================= */}
      <footer className={s.footer}>
        <div className={s.wrap}>
          <div className={s.footerRow}>
            <span className={s.footerBrand}>Hethe Breuer</span>
            <div className={s.footerLinks}>
              <a href="https://www.hethebreuer.com" target="_blank" rel="noreferrer">
                www.hethebreuer.com
              </a>
              <a href="mailto:hethebreuer@gmail.com">hethebreuer@gmail.com</a>
            </div>
          </div>
          <p className={`${s.mono} ${s.disclaimer}`}>
            Concept. Not affiliated with Anduril Industries.
          </p>
        </div>
      </footer>
    </main>
  );
}
