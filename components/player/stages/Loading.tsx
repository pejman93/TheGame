"use client";
import { useEffect, useRef, useState } from "react";
import { sleep, type StageProps } from "../shared";

export function Loading({ stage, audio, next }: StageProps<"loading">) {
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(2);
  const [msg, setMsg] = useState(stage.messages[0] ?? "");
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;
    const m = (i: number) => stage.messages[Math.min(i, stage.messages.length - 1)] ?? "";
    const go = async (to: number, seconds: number, message?: string) => {
      if (cancelled) return;
      if (message) setMsg(message);
      setSpeed(seconds);
      setProgress(to);
      await sleep(seconds * 1000 + 200);
    };
    (async () => {
      await sleep(300);
      await go(36, 2, m(0));
      await go(67, 2.2, m(1));
      await go(99, 3, m(2));
      if (cancelled) return;
      await sleep(1400);
      if (cancelled) return;
      setMsg("Recalculating…");
      audio.sfx("error");
      await sleep(1300);
      await go(23, 1.2, m(3));
      await go(100, 2.6, m(4));
      if (cancelled) return;
      audio.sfx("ding");
      setMsg("Done!");
      await sleep(900);
      if (!cancelled) next();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="stage loading">
      <div className="card">
        <h2>{stage.title}</h2>
        <div className="bar" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div className="bar-fill" style={{ width: `${progress}%`, transitionDuration: `${speed}s` }} />
        </div>
        <div className="bar-row">
          <span className="muted">{msg}</span>
          <span className="pct">
            <AnimatedNumber value={progress} seconds={speed} />%
          </span>
        </div>
        <button
          className="btn btn-ghost small"
          onClick={() => {
            audio.sfx("error");
            setToast("Cancelling is not available during birthday season.");
            setTimeout(() => setToast(""), 2500);
          }}
        >
          Cancel
        </button>
        {toast && <p className="warn">{toast}</p>}
      </div>
    </div>
  );
}

/** Counts toward the bar's target at the same speed as the CSS transition. */
function AnimatedNumber({ value, seconds }: { value: number; seconds: number }) {
  const [shown, setShown] = useState(0);
  const current = useRef(0);
  useEffect(() => {
    const from = current.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (seconds * 1000));
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      current.current = from + (value - from) * eased;
      setShown(current.current);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, seconds]);
  return <>{Math.round(shown)}</>;
}
