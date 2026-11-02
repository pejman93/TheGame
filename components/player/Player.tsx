"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AudioEngine } from "@/lib/client/audio-engine";
import type { SurpriseConfig } from "@/lib/types";
import type { Stage } from "@/games/types";
import { SCRIPTS } from "@/games";
import { Gate } from "./stages/Gate";
import { VoiceNote } from "./stages/VoiceNote";
import { Chat } from "./stages/Chat";
import { Terms } from "./stages/Terms";
import { Loading } from "./stages/Loading";
import { Captcha } from "./stages/Captcha";
import { Glitch } from "./stages/Glitch";
import { Blackout } from "./stages/Blackout";
import { Candles } from "./stages/Candles";
import { Reveal } from "./stages/Reveal";
import { FinaleGate } from "./stages/FinaleGate";
import { Finale } from "./stages/Finale";

export function Player({ cfg, preview }: { cfg: SurpriseConfig; preview: boolean }) {
  const audioRef = useRef<AudioEngine | null>(null);
  if (!audioRef.current) audioRef.current = new AudioEngine();
  const audio = audioRef.current;

  const script = SCRIPTS[cfg.game];
  const stages = useMemo<Stage[]>(() => {
    if (!script) return [];
    const hasVoice = Boolean(cfg.voice.main || cfg.voice.creepy);
    // Without any voice recording, voice-note screens are skipped (the rest still has sound).
    return script.build(cfg).filter((s) => s.type !== "voice" || hasVoice);
  }, [cfg, script]);

  const [index, setIndex] = useState(0);
  const [askSkip, setAskSkip] = useState(false);
  const [muted, setMuted] = useState(false);
  const [locked, setLocked] = useState(() => isLocked(cfg, preview));

  useEffect(() => {
    audio.preload({ main: cfg.voice.main, creepy: cfg.voice.creepy });
    for (const p of cfg.photos) {
      const img = new Image();
      img.src = p.url;
    }
    return () => audio.stopAll();
  }, [audio, cfg]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const t = stages[index]?.type;
    if (t === "finale-gate" || t === "finale") audio.stopDrone();
  }, [index, stages, audio]);

  if (!script) return <div className="stage">This game is not available yet.</div>;
  if (locked) return <Sealed cfg={cfg} onOpen={() => setLocked(false)} />;

  const stage = stages[index];
  const next = () => setIndex((i) => Math.min(i + 1, stages.length - 1));
  const gateIndex = stages.findIndex((s) => s.type === "finale-gate");
  const canSkip = index > 0 && stage.type !== "finale-gate" && stage.type !== "finale";
  const isFinale = stage.type === "finale";

  const props = { cfg, audio, next };
  return (
    <main className={`player ${isFinale ? "theme-finale" : `theme-${script.theme}`}`}>
      {/* `key` remounts each stage so its script starts fresh. */}
      <div key={index} className="stage-wrap">
        {renderStage(stage, props)}
      </div>

      {index > 0 && (
        <button
          className="mute"
          aria-label={muted ? "Unmute" : "Mute"}
          onClick={() => {
            audio.unlock();
            audio.setMuted(!muted);
            setMuted(!muted);
          }}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      )}

      {canSkip && (
        <button className="skip" aria-label="Skip to the surprise" onClick={() => setAskSkip(true)}>
          🎈
        </button>
      )}
      {askSkip && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="card">
            <p>Too much? Skip straight to the surprise.</p>
            <div className="row">
              <button
                className="btn btn-primary"
                onClick={() => {
                  audio.unlock();
                  audio.stopAll();
                  setAskSkip(false);
                  setIndex(gateIndex >= 0 ? gateIndex : stages.length - 1);
                }}
              >
                Skip to the surprise
              </button>
              <button className="btn btn-ghost" onClick={() => setAskSkip(false)}>
                Keep playing
              </button>
            </div>
          </div>
        </div>
      )}
      {preview && <div className="preview-badge">Preview</div>}
    </main>
  );
}

type Common = { cfg: SurpriseConfig; audio: AudioEngine; next: () => void };

function renderStage(stage: Stage, p: Common) {
  switch (stage.type) {
    case "gate":
      return <Gate stage={stage} {...p} />;
    case "voice":
      return <VoiceNote stage={stage} {...p} />;
    case "chat":
      return <Chat stage={stage} {...p} />;
    case "terms":
      return <Terms stage={stage} {...p} />;
    case "loading":
      return <Loading stage={stage} {...p} />;
    case "captcha":
      return <Captcha stage={stage} {...p} />;
    case "glitch":
      return <Glitch stage={stage} {...p} />;
    case "blackout":
      return <Blackout stage={stage} {...p} />;
    case "candles":
      return <Candles stage={stage} {...p} />;
    case "reveal":
      return <Reveal stage={stage} {...p} />;
    case "finale-gate":
      return <FinaleGate stage={stage} {...p} />;
    case "finale":
      return <Finale stage={stage} {...p} />;
  }
}

function isLocked(cfg: SurpriseConfig, preview: boolean) {
  if (preview || !cfg.unlockAt) return false;
  return Date.parse(cfg.unlockAt) > Date.now();
}

/** Shown before the unlock time: a sealed package with a countdown. */
function Sealed({ cfg, onOpen }: { cfg: SurpriseConfig; onOpen: () => void }) {
  const target = Date.parse(cfg.unlockAt ?? "");
  // Starts empty so the server and browser render the same HTML; ticks after mount.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = now === null ? 1 : Math.max(0, target - now);
  const d = Math.floor(left / 86_400_000);
  const h = Math.floor((left / 3_600_000) % 24);
  const m = Math.floor((left / 60_000) % 60);
  const s = Math.floor((left / 1000) % 60);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <main className="player theme-sealed">
      <div className="stage gate">
        <div className="gate-icon" aria-hidden>
          🔒
        </div>
        <div className="kicker">ACCESS DENIED</div>
        <h1>This package is sealed, {cfg.recipientName}.</h1>
        {left > 0 ? (
          <>
            <p>It can only be opened at the right moment. Not a second earlier.</p>
            <div className="countdown">
              {now === null ? (
                "--:--:--"
              ) : (
                <>
                  {d > 0 && <span>{d}d </span>}
                  {pad(h)}:{pad(m)}:{pad(s)}
                </>
              )}
            </div>
            <p className="note">Come back when the timer hits zero.</p>
          </>
        ) : (
          <>
            <p>The seal is broken. It&apos;s time.</p>
            <button className="btn btn-primary btn-lg pulse" onClick={onOpen}>
              Open the package
            </button>
          </>
        )}
      </div>
    </main>
  );
}
