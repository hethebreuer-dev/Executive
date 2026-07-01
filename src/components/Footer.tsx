import Link from "next/link";
import { PHONE, PHONE_HREF } from "@/lib/content";

export function Footer() {
  return (
    <footer className="rounded-2xl bg-footer px-5 py-6 sm:px-7 sm:py-6 flex flex-col sm:flex-row sm:justify-between gap-4">
      <div>
        <p className="font-display font-extrabold text-sm text-white mb-2">
          EXECUTIVE <span className="text-signal">OUTDOOR</span> SOLUTIONS
        </p>
        <p className="font-data text-xs text-subtle">
          <a href={PHONE_HREF} className="hover:text-white">
            {PHONE}
          </a>{" "}
          · Des Moines metro
        </p>
      </div>
      <div className="text-xs text-subtle leading-loose sm:text-right">
        <Link href="/services/lawn-care" className="block hover:text-white">
          Lawn Care
        </Link>
        <Link href="/services/landscaping-hardscape" className="block hover:text-white">
          Landscaping &amp; Hardscape
        </Link>
        <Link href="/services/holiday-lighting" className="block hover:text-white">
          Holiday Lighting
        </Link>
      </div>
    </footer>
  );
}
