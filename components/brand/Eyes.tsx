"use client";
import { useEffect, useRef } from "react";

/**
 * The brand mark: two glowing cat eyes in the dark.
 * They blink now and then and (optionally) follow the pointer.
 */
export function Eyes({
  size = 220,
  follow = true,
  className = "",
}: {
  size?: number;
  follow?: boolean;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!follow) return;
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.max(1, Math.hypot(dx, dy));
      const k = Math.min(1, d / 400);
      el.style.setProperty("--px", `${((dx / d) * 9 * k).toFixed(2)}px`);
      el.style.setProperty("--py", `${((dy / d) * 4 * k).toFixed(2)}px`);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [follow]);

  return (
    <svg
      ref={ref}
      className={`eyes ${className}`}
      width={size}
      height={size * 0.4}
      viewBox="0 0 200 80"
      role="img"
      aria-label="Two glowing cat eyes"
    >
      <defs>
        <radialGradient id="eyeFill" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#fff4c2" />
          <stop offset=".45" stopColor="#f2c230" />
          <stop offset="1" stopColor="#b57a0c" />
        </radialGradient>
        <filter id="eyeGlow" x="-60%" y="-120%" width="220%" height="340%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {[60, 140].map((cx) => (
        <g key={cx} transform={`translate(${cx} 40)`}>
          <g className="eye">
            <path d="M-36 0 Q0 -27 36 0 Q0 27 -36 0 Z" fill="#f2c230" opacity=".55" filter="url(#eyeGlow)" />
            <path d="M-36 0 Q0 -27 36 0 Q0 27 -36 0 Z" fill="url(#eyeFill)" />
            <ellipse className="pupil" rx="4.6" ry="17" fill="#0b0a09" />
          </g>
        </g>
      ))}
    </svg>
  );
}
