import { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-3 p-4 sm:p-6">
      {children}
    </div>
  );
}
