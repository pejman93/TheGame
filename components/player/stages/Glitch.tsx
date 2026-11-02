"use client";
import { useEffect, useState } from "react";
import { vibrate } from "@/lib/client/audio-engine";
import { sleep, type StageProps } from "../shared";

export function Glitch({ stage, audio, next }: StageProps<"glitch">) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let cancelled = false;
    audio.sfx("glitch");
    vibrate([200, 80, 120, 80, 300]);

    const lines = (async () => {
      for (let i = 1; i <= stage.lines.length; i++) {
        await sleep(i === 1 ? 300 : 750);
        if (cancelled) return;
        setShown(i);
        audio.sfx(i % 2 ? "glitch" : "click");
      }
      await sleep(1200);
    })();

    const sound = (async () => {
      await sleep(400);
      for (const cue of stage.audio) {
        if (cancelled) return;
        audio.sfx("static", 0.4);
        await audio.play(cue.clip, cue.effect);
      }
    })();

    Promise.all([lines, sound]).then(() => {
      if (!cancelled) next();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`stage glitch glitch-${stage.variant}`} role="alert">
      <div className="scanlines" aria-hidden />
      <div className="glitch-lines">
        {stage.lines.slice(0, shown).map((l, i) => (
          <div key={i} className="glitch-line" data-text={l}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
