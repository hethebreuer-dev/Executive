import Image from "next/image";
import Link from "next/link";

export function ServiceImageCard({
  href,
  image,
  icon,
  title,
  desc,
  large = false,
}: {
  href: string;
  image: string;
  icon: string;
  title: string;
  desc: string;
  large?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-xl p-4 sm:p-5 ${
        large ? "min-h-[280px] sm:min-h-[460px]" : "min-h-[200px] sm:min-h-[224px]"
      }`}
    >
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal from-10% via-charcoal/10 via-40% to-transparent" />

      <div className="relative z-10 flex items-start justify-between">
        <span className="inline-flex items-center rounded-lg border-[0.5px] border-white/25 bg-white/10 px-2.5 py-2 text-base text-signal backdrop-blur-md">
          {icon}
        </span>
        <span className="font-data inline-flex items-center rounded-lg border-[0.5px] border-white/25 bg-white/10 px-3 py-1.5 text-[11px] text-white backdrop-blur-md">
          view ›
        </span>
      </div>

      <div className="relative z-10">
        <p className={`font-display font-extrabold text-white ${large ? "text-xl sm:text-2xl mb-1" : "text-base sm:text-[17px] mb-0.5"}`}>
          {title}
        </p>
        <p className="text-xs text-light-gray m-0 max-w-[320px]">{desc}</p>
      </div>
    </Link>
  );
}
