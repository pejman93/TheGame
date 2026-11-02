"use client";
import { useEffect, useState } from "react";
import { sleep, type StageProps } from "../shared";

export function VoiceNote({ stage, audio, next }: StageProps<"voice">) {
  const [phase, setPhase] = useState<"playing" | "after">("playing");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await sleep(600);
      if (cancelled) return;
      await audio.play(stage.clip, stage.effect, { maxDuration: stage.maxDuration });
      if (cancelled) return;
      if (stage.after) {
        if (stage.after.sfx) audio.sfx(stage.after.sfx, 1.2);
        setPhase("after");
        await sleep(2600);
      } else {
        await sleep(500);
      }
      if (!cancelled) next();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="stage voice-note">
      <div className="card">
        <div className="kicker">{stage.title}</div>
        {stage.text && <p>{stage.text}</p>}
        <div className={`wave ${phase === "playing" ? "on" : "off"}`} aria-hidden>
          {Array.from({ length: 24 }, (_, i) => (
            <span key={i} style={{ animationDelay: `${(i % 8) * 0.09}s` }} />
          ))}
        </div>
        {phase === "after" && stage.after?.text && <p className="warn">{stage.after.text}</p>}
      </div>
    </div>
  );
}
