"use client";
import { useMemo, useState } from "react";
import { shuffle, type StageProps } from "../shared";

const EMOJI = ["🐸", "🍕", "🦆", "🧀", "🚗", "🌵", "🐌", "🥦", "🦄", "🪑", "🍌", "🐙"];
const FAILS = [
  (n: string) => `Incorrect. ${n} is ALWAYS being dramatic. Try again.`,
  () => "Hmm. Our system detected excessive drama. Please try again.",
];

type Tile = { kind: "photo"; url: string } | { kind: "emoji"; e: string };

export function Captcha({ stage, cfg, audio, next }: StageProps<"captcha">) {
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [passed, setPassed] = useState(false);

  const tiles = useMemo<Tile[]>(() => {
    const photos: Tile[] = cfg.photos.map((p) => ({ kind: "photo", url: p.url }));
    const fill: Tile[] = shuffle(EMOJI)
      .slice(0, 9 - photos.length)
      .map((e) => ({ kind: "emoji", e }));
    return shuffle([...photos, ...fill]);
  }, [cfg.photos, attempt]); // reshuffle on every attempt

  const verify = () => {
    if (attempt < FAILS.length) {
      audio.sfx("error");
      setError(FAILS[attempt](cfg.recipientName));
      setAttempt((a) => a + 1);
      setSelected(new Set());
      return;
    }
    audio.sfx("ding");
    setError("");
    setPassed(true);
    setTimeout(next, 1100);
  };

  return (
    <div className="stage captcha">
      <div className="card">
        <div className="captcha-head">
          <span>{stage.prompt}</span>
        </div>
        <div className="captcha-grid">
          {tiles.map((t, i) => (
            <button
              key={`${attempt}-${i}`}
              className={`tile ${selected.has(i) ? "on" : ""}`}
              onClick={() => {
                audio.sfx("click");
                setSelected((prev) => {
                  const s = new Set(prev);
                  if (s.has(i)) s.delete(i);
                  else s.add(i);
                  return s;
                });
              }}
            >
              {t.kind === "photo" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.url} alt="" />
              ) : (
                <span aria-hidden>{t.e}</span>
              )}
            </button>
          ))}
        </div>
        {error && <p className="warn">{error}</p>}
        {passed ? (
          <p className="ok">✓ Verified. You are dramatic enough.</p>
        ) : (
          <button className="btn btn-primary" onClick={verify}>
            Verify
          </button>
        )}
      </div>
    </div>
  );
}
