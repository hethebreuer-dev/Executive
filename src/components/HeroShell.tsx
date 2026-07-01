import { ReactNode } from "react";
import { Nav } from "./Nav";

export function HeroShell({
  children,
  compact = false,
}: {
  children?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-ink px-5 sm:px-10 ${
        compact ? "pt-24 pb-6 sm:pt-28 sm:pb-8" : "pt-24 pb-6 sm:pt-28 sm:pb-14"
      }`}
    >
      <Nav />
      {children}
    </div>
  );
}
