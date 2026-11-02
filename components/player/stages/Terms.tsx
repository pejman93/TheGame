"use client";
import { useRef, useState } from "react";
import type { StageProps } from "../shared";

const DODGE_LINES = ["Decline", "Nope", "Not available", "Nice try", "Still no", "😏"];

export function Terms({ stage, audio, next }: StageProps<"terms">) {
  const [checked, setChecked] = useState<boolean[]>(() => stage.items.map(() => false));
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dodges, setDodges] = useState(0);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const zone = useRef<HTMLDivElement>(null);

  const allChecked = checked.every(Boolean);

  const dodge = () => {
    const box = zone.current?.getBoundingClientRect();
    const w = box ? box.width / 2 - 60 : 100;
    const x = (Math.random() * 2 - 1) * Math.max(40, w);
    const y = -20 - Math.random() * 90;
    setOffset({ x, y });
    setDodges((d) => d + 1);
    audio.sfx("pop");
  };

  const accept = () => {
    if (!allChecked) {
      setError("Please accept ALL the terms. Especially the last one.");
      setShake(true);
      audio.sfx("error");
      setTimeout(() => setShake(false), 500);
      return;
    }
    audio.sfx("ding");
    next();
  };

  return (
    <div className="stage terms">
      <div className={`card ${shake ? "shake" : ""}`}>
        <h2>{stage.title}</h2>
        <p className="muted">{stage.intro}</p>
        <ol className="terms-list">
          {stage.items.map((item, i) => (
            <li key={i}>
              <label>
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setChecked((prev) => prev.map((c, j) => (j === i ? v : c)));
                    setError("");
                    audio.sfx("click");
                  }}
                />
                <span>{item}</span>
              </label>
            </li>
          ))}
        </ol>
        <p className="fine">
          Section 14(b): The Recipient agrees that this agreement is legally binding in all known
          universes, including the one where birthdays are optional.
        </p>
        {error && <p className="warn">{error}</p>}
        <div className="terms-buttons" ref={zone}>
          <button className="btn btn-primary" onClick={accept}>
            {stage.accept}
          </button>
          <button
            className="btn btn-ghost dodge"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
            onPointerEnter={(e) => e.pointerType === "mouse" && dodge()}
            onPointerDown={(e) => {
              e.preventDefault();
              dodge();
            }}
            onClick={(e) => {
              e.preventDefault();
              dodge();
            }}
          >
            {dodges === 0 ? stage.decline : DODGE_LINES[dodges % DODGE_LINES.length]}
          </button>
        </div>
      </div>
    </div>
  );
}
