"use client";
import type { StageProps } from "../shared";

export function Gate({ stage, audio, next }: StageProps<"gate">) {
  return (
    <div className="stage gate">
      <div className="gate-icon" aria-hidden>
        {stage.icon}
      </div>
      {stage.kicker && <div className="kicker">{stage.kicker}</div>}
      <h1>{stage.title}</h1>
      <p className="pre">{stage.text}</p>
      <button
        className="btn btn-primary btn-lg"
        onClick={() => {
          audio.unlock();
          audio.sfx("whoosh");
          next();
        }}
      >
        {stage.button}
      </button>
      {stage.note && <p className="note">{stage.note}</p>}
    </div>
  );
}
