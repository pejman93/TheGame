import Link from "next/link";

/** Small wordmark: a tiny pair of eyes and "The Game". */
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="logo" aria-label="The Game, home">
      <svg width="34" height="14" viewBox="0 0 200 80" aria-hidden>
        <path d="M24 40 Q60 13 96 40 Q60 67 24 40 Z" fill="#f2c230" />
        <path d="M104 40 Q140 13 176 40 Q140 67 104 40 Z" fill="#f2c230" />
        <ellipse cx="60" cy="40" rx="5" ry="17" fill="#0b0a09" />
        <ellipse cx="140" cy="40" rx="5" ry="17" fill="#0b0a09" />
      </svg>
      <span>The Game</span>
    </Link>
  );
}
