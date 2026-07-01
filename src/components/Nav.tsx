"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/lib/content";

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cx(
        scrolled ? "fixed" : "absolute",
        "inset-x-0 top-3 sm:top-5 z-40"
      )}
    >
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
        <div
          className={cx(
            "flex items-center justify-between rounded-xl border-[0.5px] border-white/[0.18] px-3.5 py-2.5 sm:px-6 sm:py-3.5 backdrop-blur-md transition-colors",
            scrolled ? "bg-ink/90 shadow-lg shadow-black/40" : "bg-white/[0.08]"
          )}
        >
          <Link href="/" className="font-display font-extrabold text-white text-xs sm:text-base whitespace-nowrap">
            EXECUTIVE <span className="text-signal">OUTDOOR</span>{" "}
            <span className="hidden sm:inline">SOLUTIONS</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-[13px] text-light-gray">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          <Link
            href="/contact"
            className="hidden md:inline-flex items-center rounded-md bg-signal px-[18px] py-2 text-[13px] font-medium text-signal-ink hover:brightness-110"
          >
            Get a quote
          </Link>

          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <>
                  <line x1="5" y1="5" x2="19" y2="19" />
                  <line x1="19" y1="5" x2="5" y2="19" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>

        {open && (
          <div className="md:hidden mt-2 flex flex-col gap-3 rounded-xl border-[0.5px] border-white/[0.18] bg-ink/95 backdrop-blur-md px-4 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-[13px] text-light-gray hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-md bg-signal px-[18px] py-2.5 text-[13px] font-medium text-signal-ink"
            >
              Get a quote
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
