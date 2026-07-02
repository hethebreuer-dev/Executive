import { GOOGLE_RATING, GOOGLE_REVIEWS_URL, GOOGLE_REVIEW_COUNT } from "@/lib/content";

function Star() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24" className="shrink-0">
      <path d="M12 2.5l2.9 6.14 6.6.75-4.9 4.63 1.28 6.62L12 17.6l-5.88 3.04 1.28-6.62-4.9-4.63 6.6-.75z" />
    </svg>
  );
}

export function GoogleReviewsBadge() {
  return (
    <a
      href={GOOGLE_REVIEWS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
    >
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} />
        ))}
      </span>
      <span className="text-xs text-light-gray">
        <span className="font-medium text-white">{GOOGLE_RATING}</span> ({GOOGLE_REVIEW_COUNT}{" "}
        Google Reviews)
      </span>
    </a>
  );
}
