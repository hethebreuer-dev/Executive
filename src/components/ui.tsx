import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const buttonBase =
  "inline-flex items-center justify-center rounded-md text-[13px] font-medium font-body transition-colors";

const buttonVariants = {
  green: "bg-signal text-signal-ink hover:brightness-110",
  outline: "border-[0.5px] border-border-dim text-white hover:border-white",
  mono: "bg-signal text-signal-ink font-data hover:brightness-110",
};

export function LinkButton({
  href,
  variant = "green",
  className,
  children,
}: {
  href: string;
  variant?: keyof typeof buttonVariants;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cx(buttonBase, buttonVariants[variant], "px-[18px] py-2", className)}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "green",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonVariants }) {
  return (
    <button className={cx(buttonBase, buttonVariants[variant], "px-[18px] py-2", className)} {...props}>
      {children}
    </button>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-xl bg-steel p-6", className)}>{children}</div>;
}

export function LightCard({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-xl bg-light-gray p-6", className)}>{children}</div>;
}

export function Eyebrow({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <p className={cx("font-data text-xs tracking-wide text-signal", className)}>{children}</p>
  );
}

export function MonoLabel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <p className={cx("font-data text-xs text-muted", className)}>{children}</p>
  );
}

export function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <Card className="flex flex-col justify-center">
      <p className="font-data text-3xl text-signal m-0">{value}</p>
      <p className="text-xs text-muted mt-1.5 m-0">{label}</p>
    </Card>
  );
}

export function Thumb({ className }: { className?: string }) {
  return <div className={cx("aspect-square rounded-lg bg-thumb", className)} />;
}
