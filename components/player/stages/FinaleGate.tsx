"use client";
import type { StageProps } from "../shared";

export function FinaleGate({ stage, audio, next }: StageProps<"finale-gate">) {
  return (
    <div className="stage finale-gate">
      <div className="gate-icon" aria-hidden>
        {stage.icon}
      </div>
      <h1>{stage.title}</h1>
      <p>{stage.text}</p>
      <button
        className="btn btn-primary btn-lg pulse"
        onClick={() => {
          audio.unlock();
          audio.stopAll();
          next();
        }}
      >
        {stage.button}
      </button>
    </div>
  );
}
