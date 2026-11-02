"use client";
import { useEffect, useState } from "react";
import { sleep, type StageProps } from "../shared";

export function Blackout({ stage, audio, next }: StageProps<"blackout">) {
  const [text, setText] = useState(false);
  const [canGo, setCanGo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    audio.stopAll();
    (async () => {
      await sleep(2200); // silence is the scariest sound
      if (cancelled) return;
      setText(true);
      await audio.play("creepy", "whisper");
      if (cancelled) return;
      await sleep(1500);
      if (!cancelled) setCanGo(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="stage blackout"
      onClick={() => {
        if (canGo) next();
      }}
    >
      {text && stage.text && <div className="blackout-text">{stage.text}</div>}
      {canGo && <div className="blackout-hint">tap to continue</div>}
    </div>
  );
}
