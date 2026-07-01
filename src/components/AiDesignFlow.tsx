"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Eyebrow } from "@/components/ui";
import { STYLE_OPTIONS } from "@/lib/content";

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const MAX_GENERATIONS = 2;

function ProgressRow({ step }: { step: 2 | 3 }) {
  const pct = step === 2 ? 66 : 100;
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="font-data text-[10px] text-signal whitespace-nowrap">STEP {step} OF 3</span>
      <div className="h-0.5 flex-1 rounded-full bg-border-dim overflow-hidden">
        <div className="h-full bg-signal" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function AiDesignFlow() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [style, setStyle] = useState<(typeof STYLE_OPTIONS)[number]>("Modern");
  const [generating, setGenerating] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoUrl(file ? URL.createObjectURL(file) : null);
  }

  function handleGenerate() {
    if (!photoFile || generating) return;
    setGenerating(true);
    // TODO: replace with a real call to the generation API once the
    // photo-edit vs. stylized-reference approach is decided (spec section 7).
    // Rate limiting (2 generations/email) must also be enforced server-side
    // against the email — this client-side counter is UI-only.
    window.setTimeout(() => {
      setGenerating(false);
      setGenerationCount((c) => c + 1);
      setStep(3);
    }, 1200);
  }

  const remaining = MAX_GENERATIONS - generationCount;

  return (
    <div className="mx-auto max-w-[420px]">
      {step === 1 && (
        <div className="text-center">
          <Eyebrow className="mb-3">AI DESIGN ASSIST</Eyebrow>
          <h1 className="font-display text-2xl sm:text-[26px] font-extrabold text-white mb-2.5">
            See your yard, redesigned.
          </h1>
          <p className="text-xs text-muted mb-6 leading-relaxed">
            Upload a photo, pick a style, get a concept back in minutes. We&rsquo;ll send it to your inbox.
          </p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (email) setStep(2);
            }}
          >
            <input
              type="email"
              required
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-md border-[0.5px] border-border-dim bg-steel px-3 py-2.5 text-[13px] text-white placeholder:text-subtle outline-none focus:border-signal"
            />
            <Button type="submit" className="whitespace-nowrap">
              Continue
            </Button>
          </form>
          <p className="text-[10px] text-subtle mt-3">
            No spam. Just your design concept and, if you want it, a real quote.
          </p>
        </div>
      )}

      {step === 2 && (
        <div>
          <ProgressRow step={2} />
          <p className="font-display text-sm font-extrabold text-white mb-1">Upload a photo of your yard</p>
          <p className="text-xs text-muted mb-4">A daytime photo of the space you want to redesign works best.</p>

          <label className="mb-4 flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border-dim px-6 py-7 text-center">
            <span className="text-signal text-lg">⇧</span>
            <span className="text-xs text-muted">
              {photoFile ? photoFile.name : "Tap to upload or take a photo"}
            </span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
          </label>

          <p className="font-data text-[10px] text-muted mb-2.5">CHOOSE A STYLE</p>
          <div className="grid grid-cols-4 gap-1.5 mb-6">
            {STYLE_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={cx(
                  "rounded-md px-1 py-2.5 text-center text-[10px] transition-colors",
                  s === style ? "bg-signal font-medium text-signal-ink" : "bg-steel text-light-gray"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!photoFile || generating}
            className="w-full py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? "Generating your concept…" : "Generate my concept"}
          </Button>
        </div>
      )}

      {step === 3 && (
        <div>
          <ProgressRow step={3} />
          <p className="font-display text-sm font-extrabold text-white mb-1">Your concept is ready</p>
          <p className="text-xs text-muted mb-4">
            {style} style · sent to your inbox
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <p className="font-data text-[9px] text-subtle mb-1.5">BEFORE</p>
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- client-side blob preview of the user's own upload
                <img src={photoUrl} alt="Your yard, before" className="aspect-[4/3] w-full rounded-lg object-cover bg-steel" />
              ) : (
                <div className="aspect-[4/3] rounded-lg bg-steel" />
              )}
            </div>
            <div>
              <p className="font-data text-[9px] text-signal mb-1.5">AFTER — {style.toUpperCase()}</p>
              <div className="aspect-[4/3] rounded-lg border-[0.5px] border-signal bg-[#4A4E44]" />
            </div>
          </div>

          <div className="rounded-lg bg-steel p-3.5 mb-3.5">
            {/* Placeholder caption — real copy should name the specific elements
                the generation actually produced once the generation API is wired up. */}
            <p className="text-xs text-light-gray leading-relaxed m-0">
              This concept adds a paver patio, a low seat wall, and border planting along the back fence —
              all things our crew can build as shown.
            </p>
          </div>

          <div className="flex gap-2 mb-2.5">
            <Link
              href={`/contact?source=design&style=${encodeURIComponent(style)}&email=${encodeURIComponent(email)}`}
              className="flex-1 rounded-md bg-signal py-2.5 text-center text-[13px] font-medium text-signal-ink"
            >
              Get a real quote for this
            </Link>
            {remaining > 0 && (
              <button
                onClick={() => setStep(2)}
                aria-label="Try another style"
                className="rounded-md border-[0.5px] border-border-dim px-3.5 text-white"
              >
                ↻
              </button>
            )}
          </div>
          <p className="text-center text-[10px] text-subtle m-0">
            {remaining > 0
              ? "Or try another style — natural, classic, low-maintenance"
              : "You've used both concept generations for this email — contact us for more design options."}
          </p>
        </div>
      )}
    </div>
  );
}
