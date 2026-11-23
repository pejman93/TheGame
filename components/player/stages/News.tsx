"use client";
import { useEffect, useRef, useState } from "react";
import { vibrate } from "@/lib/client/audio-engine";
import { sleep, type StageProps } from "../shared";

type Phase = "incoming" | "live" | "poll" | "result" | "lost";

/** A fake TV news broadcast about the birthday person, read out by an "anchor". */
export function News({ stage, cfg, audio, next }: StageProps<"news">) {
  const [phase, setPhase] = useState<Phase>("incoming");
  const [line, setLine] = useState("");
  const [creepy, setCreepy] = useState(false);
  const [vote, setVote] = useState<number | null>(null);
  const [clock, setClock] = useState("");
  const cancelled = useRef(false);

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick();
    const t = setInterval(tick, 10_000);
    return () => {
      clearInterval(t);
      cancelled.current = true;
      audio.stopSpeech();
    };
  }, [audio]);

  const signalLost = async () => {
    setPhase("lost");
    audio.stopSpeech();
    audio.sfx("glitch");
    audio.sfx("static", 1.4);
    vibrate([80, 40, 80]);
    await sleep(1700);
    if (!cancelled.current) next();
  };

  const start = async () => {
    audio.unlock(); // inside the tap, so phones allow sound and speech
    setPhase("live");
    audio.sfx("news");
    vibrate(60);
    await sleep(2300);
    for (let i = 0; i < stage.lines.length; i++) {
      if (cancelled.current) return;
      const text = stage.lines[i];
      const spooky = stage.variant === "haunt" && i === stage.lines.length - 1;
      setLine(text);
      if (spooky) {
        setCreepy(true);
        audio.sfx("glitch");
      }
      await Promise.all([
        audio.speak(text, spooky ? { rate: 0.55, pitch: 0.1 } : { rate: 0.98, pitch: 0.9 }),
        sleep(900 + text.length * 40), // keep captions readable even without speech
      ]);
      await sleep(250);
    }
    if (cancelled.current) return;
    if (stage.poll) setPhase("poll");
    else await signalLost();
  };

  const answer = async (i: number) => {
    setVote(i);
    setPhase("result");
    audio.sfx("ding");
    await sleep(2600);
    if (!cancelled.current) await signalLost();
  };

  const photo = cfg.photos[0]?.url;
  const ticker = stage.ticker.join("   ●   ");

  if (phase === "incoming") {
    return (
      <div className={`stage news news-${stage.variant} news-incoming`}>
        <div className="news-noise" aria-hidden />
        <div className="news-alert">⚠ INCOMING BROADCAST</div>
        <p className="news-alert-sub">An urgent message is interrupting this program.</p>
        <button className="btn btn-news btn-lg" onClick={start}>
          ▶ Watch now
        </button>
      </div>
    );
  }

  return (
    <div className={`stage news news-${stage.variant} ${creepy ? "news-creepy" : ""}`}>
      <div className="tv">
        <div className="tv-top">
          <span className="tv-logo">{stage.channel}</span>
          <span className="tv-live">● LIVE</span>
          <span className="tv-clock">{clock}</span>
        </div>
        <div className="tv-screen">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className={stage.picture === "suspect" ? "suspect" : ""} />
          ) : (
            <div className="tv-placeholder" aria-hidden>
              {stage.picture === "suspect" ? "👤" : "🎂"}
            </div>
          )}
          <span className="tv-label">{stage.label}</span>
          <div className="tv-scan" aria-hidden />
        </div>
        <div className="lower-third">
          <div className="lt-tag">BREAKING NEWS</div>
          <div className="lt-headline">{stage.headline}</div>
          <div className="lt-sub">{stage.subhead}</div>
        </div>
        <div className="ticker" aria-hidden>
          <div className="ticker-track">
            <span>{ticker}   ●   </span>
            <span>{ticker}   ●   </span>
          </div>
        </div>
        {phase === "lost" && (
          <div className="tv-lost">
            <span>SIGNAL LOST</span>
          </div>
        )}
      </div>

      {(phase === "live" || phase === "lost") && (
        <div className="captions" aria-live="polite">
          {line && (
            <>
              <span className="cap-who">ANCHOR</span> {line}
            </>
          )}
        </div>
      )}

      {stage.poll && (phase === "poll" || phase === "result") && (
        <div className="poll">
          <div className="poll-q">📊 {stage.poll.question}</div>
          {phase === "poll" ? (
            <div className="poll-options">
              {stage.poll.options.map((o, i) => (
                <button key={o} className="btn btn-news" onClick={() => answer(i)}>
                  {o}
                </button>
              ))}
            </div>
          ) : (
            <div className="poll-result">
              {stage.poll.options.map((o, i) => (
                <div key={o} className="poll-row">
                  <span>
                    {o} {vote === i ? "✓" : ""}
                  </span>
                  <div className="poll-bar">
                    <div style={{ width: i === 0 ? "51%" : "49%" }} />
                  </div>
                </div>
              ))}
              <p className="poll-note">{stage.poll.result}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
