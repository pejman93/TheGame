"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Confetti } from "../Confetti";
import { sleep, type StageProps } from "../shared";

export function Finale({ stage, cfg, audio }: StageProps<"finale">) {
  const [burst, setBurst] = useState(1);
  const [typed, setTyped] = useState(0);
  const [busy, setBusy] = useState(true);
  const hasVoice = audio.hasClip("main");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      audio.sfx("sparkle");
      await sleep(700);
      if (cancelled) return;
      if (hasVoice) {
        await audio.play("main", "warm");
        await sleep(400);
      }
      if (cancelled) return;
      setBurst((b) => b + 1);
      await audio.birthdaySong();
      if (!cancelled) setBusy(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typed >= cfg.message.length) return;
    const t = setTimeout(() => setTyped((n) => n + 1), typed === 0 ? 1600 : 28);
    return () => clearTimeout(t);
  }, [typed, cfg.message.length]);

  const replay = async (what: "song" | "voice") => {
    if (busy) return;
    setBusy(true);
    audio.unlock();
    setBurst((b) => b + 1);
    if (what === "song") await audio.birthdaySong();
    else await audio.play("main", "warm");
    setBusy(false);
  };

  return (
    <div className="stage finale">
      <Confetti burst={burst} />
      <div className="finale-inner">
        {cfg.age ? <div className="age-badge">🎂 {cfg.age}</div> : <div className="age-badge">🎂</div>}
        <h1 className="finale-title">{stage.headline}</h1>
        <p className="finale-sub">{stage.subline}</p>

        {cfg.photos.length > 0 && (
          <div className="polaroids">
            {cfg.photos.map((p, i) => (
              <figure key={p.url} className="polaroid" style={{ ["--tilt" as string]: `${(i - 1) * 6}deg` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" />
              </figure>
            ))}
          </div>
        )}

        <div className="letter">
          <p className="pre">
            {cfg.message.slice(0, typed)}
            {typed < cfg.message.length && <span className="caret">|</span>}
          </p>
          <p className="signature">— {cfg.senderName}</p>
        </div>

        <div className="finale-actions">
          <button className="btn btn-light" disabled={busy} onClick={() => replay("song")}>
            🎵 Play the song again
          </button>
          {hasVoice && (
            <button className="btn btn-light" disabled={busy} onClick={() => replay("voice")}>
              🔊 Hear {cfg.senderName} again
            </button>
          )}
        </div>
        <Link href="/" className="make-one">
          Prank someone else with The Game →
        </Link>
      </div>
    </div>
  );
}
