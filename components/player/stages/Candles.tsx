"use client";
import { useState } from "react";
import { sleep, type StageProps } from "../shared";

export function Candles({ stage, audio, next }: StageProps<"candles">) {
  const [lit, setLit] = useState<boolean[]>(() => Array(stage.count).fill(false));
  const [blown, setBlown] = useState(false);
  const all = lit.every(Boolean);

  const blow = async () => {
    audio.sfx("whoosh");
    setBlown(true);
    await sleep(500);
    await audio.play("main", "reverse", { maxDuration: 3 });
    await sleep(600);
    next();
  };

  return (
    <div className={`stage candles ${blown ? "out" : ""}`}>
      <p className="ghost-line">
        {blown ? "…" : all ? "now… make a wish" : "light the candles. all of them."}
      </p>
      <div className="candle-row">
        {lit.map((on, i) => (
          <button
            key={i}
            className={`candle ${on && !blown ? "lit" : ""}`}
            aria-label={on ? "lit candle" : "unlit candle"}
            disabled={on || blown}
            onClick={() => {
              audio.sfx("pop");
              setLit((prev) => prev.map((v, j) => (j === i ? true : v)));
            }}
          >
            <span className="flame" />
            <span className="wax" />
          </button>
        ))}
      </div>
      {all && !blown && (
        <button className="btn btn-ghost" onClick={blow}>
          I made a wish
        </button>
      )}
    </div>
  );
}
