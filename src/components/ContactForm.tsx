"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, LightCard, MonoLabel } from "@/components/ui";

const SERVICE_OPTIONS = ["Lawn care", "Landscaping & hardscape", "Holiday lighting", "Not sure yet"];

const inputClass =
  "w-full rounded-md border-[0.5px] border-border-dim bg-steel px-3.5 py-2.5 text-[13px] text-white placeholder:text-subtle outline-none focus:border-signal";

export function ContactForm() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const style = searchParams.get("style");
  const prefillEmail = searchParams.get("email") ?? "";

  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <LightCard className="text-charcoal">
        <p className="font-display font-extrabold text-base text-ink mb-1.5">Thanks — we&rsquo;ll be in touch.</p>
        <p className="text-[13px] text-light-ink m-0">
          A member of our team will follow up shortly to talk through your project.
        </p>
      </LightCard>
    );
  }

  return (
    <div className="rounded-xl bg-steel p-5 sm:p-6">
      {source === "design" && (
        <MonoLabel className="mt-0 mb-4">
          REFERRED FROM AI DESIGN TOOL{style ? ` · ${style.toUpperCase()} CONCEPT` : ""}
        </MonoLabel>
      )}
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          // TODO: submit to CRM/lead routing once the tool (Jobber/LMN/
          // ServiceTitan) is confirmed with the owner — spec section 8.
          setSubmitted(true);
        }}
      >
        <input type="text" required placeholder="Name" className={inputClass} />
        <input type="email" required defaultValue={prefillEmail} placeholder="Email" className={inputClass} />
        <input type="tel" placeholder="Phone" className={inputClass} />
        <input type="text" placeholder="Property address" className={inputClass} />
        <select defaultValue="" className={inputClass}>
          <option value="" disabled>
            What are you interested in?
          </option>
          {SERVICE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <textarea placeholder="Tell us about your project" rows={4} className={inputClass} />
        <Button type="submit" className="mt-1 py-2.5">
          Send
        </Button>
      </form>
    </div>
  );
}
