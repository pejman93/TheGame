"use client";
import { useState } from "react";
import { vibrate } from "@/lib/client/audio-engine";
import { sleep, type StageProps } from "../shared";

const BLUR = [30, 22, 15, 15];

export function Reveal({ stage, cfg, audio, next }: StageProps<"reveal">) {
  const [step, setStep] = useState(0);
  const [cut, setCut] = useState(false);
  const photo = cfg.photos[0]?.url;

  const tap = async () => {
    if (step < stage.clues.length) {
      audio.sfx("sparkle");
      setStep((s) => s + 1);
      return;
    }
    audio.sfx("glitch");
    vibrate([150, 60, 150]);
    setCut(true);
    await sleep(2000);
    next();
  };

  return (
    <div className="stage reveal">
      <div className={`card ${cut ? "cut" : ""}`}>
        <h2>{cut ? stage.cutText : stage.title}</h2>
        <div className="reveal-photo">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" style={{ filter: `blur(${BLUR[step]}px)` }} />
          ) : (
            <div className="silhouette" style={{ filter: `blur(${BLUR[step] / 3}px)` }}>
              👤
            </div>
          )}
          {cut && <div className="reveal-static" />}
        </div>
        <ul className="clues">
          {stage.clues.slice(0, step).map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        {!cut && (
          <button className="btn btn-primary" onClick={tap}>
            {step < stage.clues.length ? "Give me a clue" : "Show me who it is"}
          </button>
        )}
      </div>
    </div>
  );
}
