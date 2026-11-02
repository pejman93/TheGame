"use client";
import { useEffect, useRef } from "react";

const COLORS = ["#ff4d8d", "#ffd23f", "#3ee8b5", "#5aa9ff", "#b06bff", "#ff8a3d"];

/** Lightweight canvas confetti. Changing `burst` fires another round. */
export function Confetti({ burst }: { burst: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const count = reduce ? 40 : 180;
    const W = () => canvas.width;
    const H = () => canvas.height;
    const parts = Array.from({ length: count }, () => ({
      x: W() / 2 + (Math.random() - 0.5) * W() * 0.3,
      y: H() * 0.35,
      vx: (Math.random() - 0.5) * 16 * dpr,
      vy: (-Math.random() * 15 - 5) * dpr,
      w: (6 + Math.random() * 6) * dpr,
      h: (8 + Math.random() * 10) * dpr,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
    const start = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const age = (now - start) / 1000;
      ctx.clearRect(0, 0, W(), H());
      ctx.globalAlpha = Math.max(0, Math.min(1, 6.5 - age));
      for (const p of parts) {
        p.vy += 0.35 * dpr;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, (-p.h / 2) * Math.cos(p.r * 2), p.w, p.h * Math.abs(Math.cos(p.r * 2)) + 1);
        ctx.restore();
      }
      if (age < 6.5) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, W(), H());
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [burst]);

  return <canvas ref={ref} className="confetti" aria-hidden />;
}
